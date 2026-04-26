import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALIYUN_TTS_ENDPOINT =
  "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer";

type AliyunTtsResponse = {
  output?: {
    audio?: {
      url?: string;
    };
  };
  code?: string;
  message?: string;
  request_id?: string;
};

type SpeechProvider = {
  fileExtension: string;
  synthesize: (input: string) => Promise<Buffer>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init?: RequestInit, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, init);

      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await sleep(1000 * attempt);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        throw error;
      }

      await sleep(1000 * attempt);
    }
  }

  throw lastError;
}

function sanitizeTtsText(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createAliyunTtsProvider(): SpeechProvider {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is required for Aliyun audio generation");
  }

  const format = process.env.ALIYUN_TTS_FORMAT || "mp3";

  return {
    fileExtension: format,
    synthesize: async (input: string) => {
      const text = sanitizeTtsText(input);

      if (!text) {
        throw new Error("TTS text is empty after sanitization");
      }

      const response = await fetchWithRetry(ALIYUN_TTS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.ALIYUN_TTS_MODEL || "cosyvoice-v3-flash",
          input: {
            text,
            voice: process.env.ALIYUN_TTS_VOICE || "longanyang",
            format,
            sample_rate: Number(process.env.ALIYUN_TTS_SAMPLE_RATE || 24000),
          },
        }),
      });

      const responseText = await response.text();
      let data: AliyunTtsResponse | null = null;

      try {
        data = JSON.parse(responseText) as AliyunTtsResponse;
      } catch {
        // Keep the raw response text for the error below.
      }

      if (!response.ok) {
        throw new Error(data?.message || responseText || `Aliyun TTS failed: ${response.status}`);
      }

      const audioUrl = data?.output?.audio?.url;
      if (!audioUrl) {
        throw new Error(data?.message || "Aliyun TTS did not return an audio URL");
      }

      const audioResponse = await fetchWithRetry(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download Aliyun TTS audio: ${audioResponse.status}`);
      }

      return Buffer.from(await audioResponse.arrayBuffer());
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, force = false } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: "Book Id is required" }, { status: 401 });
    }

    // Get book and summary
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        summary: true,
        chapters: {
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (!book.summary) {
      return NextResponse.json({ error: "Please generate summary first" }, { status: 400 });
    }

    if (book.chapters.length === 0) {
      return NextResponse.json(
        { error: "No chapters found. Please generate summary chapters first" },
        { status: 400 }
      );
    }

    const ttsProvider = createAliyunTtsProvider();

    // Create upload direactor if its does not exist
    const uploadDir = join(process.cwd(), "public", "uploads", "audio");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const sendEvent = (payload: Record<string, unknown>) => {
          if (closed) return;

          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch (error) {
            closed = true;
            console.warn("Audio generation progress stream closed", error);
          }
        };
        const sendMessage = (message: string) => {
          sendEvent({ message });
        };
        const closeStream = () => {
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // The client may already have closed the stream.
            }
          }
        };
        const withHeartbeat = async <T,>(message: string, task: Promise<T>) => {
          const interval = setInterval(() => sendMessage(message), 10000);

          try {
            return await task;
          } finally {
            clearInterval(interval);
          }
        };

        try {
          sendMessage("Starting audio generation...");
          let totalDuration = 0;

          // generate audio for each chapter

          for (let i = 0; i < book.chapters.length; i++) {
            const chapter = book.chapters[i];

            if (!force && chapter.audioUrl) {
              totalDuration += chapter.audioDuration;
              sendMessage(`Skipping Chapter ${chapter.chapterNumber}: audio already exists`);
              continue;
            }

            sendMessage(
              `Generating audio for Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}...`
            );

            const audioInput = `Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}. ${chapter.chapterSummary}`;
            const audioBuffer = await withHeartbeat(
              `Still generating Chapter ${chapter.chapterNumber} audio...`,
              ttsProvider.synthesize(audioInput)
            );

            // Save audio file
            const audioFilename = `${book.id}-chapter-${chapter.chapterNumber}-${Date.now()}.${ttsProvider.fileExtension}`;
            const audioPath = join(uploadDir, audioFilename);
            await writeFile(audioPath, audioBuffer);

            const audioUrl = `/uploads/audio/${audioFilename}`;

            // Estimate duration (150 Words per minute, average 5 characters per word)
            const estimatedDuration = Math.ceil((chapter.chapterSummary.length / 5 / 150) * 60);
            totalDuration += estimatedDuration;

            // Update chapter with audio url
            await prisma.bookChapter.update({
              where: { id: chapter.id },
              data: {
                audioUrl: audioUrl,
                audioDuration: estimatedDuration,
              },
            });
            sendMessage(`Chapter ${chapter.chapterNumber} audio generated successfully`);
          }

          // Update book with audio status
          await prisma.book.update({
            where: { id: book.id },
            data: {
              audioGenerated: true,
              totalAudioDuration: totalDuration,
            },
          });
          sendMessage("Audio generation completed");
          sendEvent({ message: "Completed", completed: true });
          closeStream();
        } catch (error) {
          console.error("Error Generating audio", error);
          const message =
            error instanceof Error ? error.message : "Unknown audio generation error";
          sendEvent({ message: `Audio generation failed: ${message}`, error: true });
          closeStream();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error Generating audio", error);
    const message = error instanceof Error ? error.message : "Failed to generate audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
