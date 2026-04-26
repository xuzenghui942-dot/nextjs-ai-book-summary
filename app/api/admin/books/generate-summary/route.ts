import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { constants } from "fs";
import { access } from "fs/promises";
import { execFile } from "child_process";
import { join } from "path";
import { promisify } from "util";

type TableOfContentsItem = {
  chapterNumber: number;
  title: string;
  description: string;
  startOffset?: number;
};

type RagChunk = {
  id: number;
  start: number;
  end: number;
  text: string;
  tokenLength: number;
  tokenCounts: Record<string, number>;
};

type RagIndex = {
  chunks: RagChunk[];
  idf: Map<string, number>;
  averageTokenLength: number;
};

type RetrieveOptions = {
  topK?: number;
  startOffset?: number;
  endOffset?: number;
};

const execFileAsync = promisify(execFile);

const MAX_SUMMARY_INPUT_CHARS = 15000;
const MAX_CHAPTER_EXTRACTION_CHARS = 50000;
const MIN_RELIABLE_CHAPTERS = 2;

const RAG_CHUNK_SIZE = 1200;
const RAG_CHUNK_OVERLAP = 220;
const RAG_TOP_K = 6;
const RAG_SNIPPET_CHARS = 900;

const RETRIEVAL_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "into",
  "your",
  "you",
  "are",
  "was",
  "were",
  "will",
  "been",
  "they",
  "their",
  "there",
  "about",
  "which",
  "when",
  "what",
  "where",
  "while",
  "than",
  "then",
  "also",
  "book",
  "chapter",
]);

const ENGLISH_WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
};

const CHINESE_DIGITS: Record<string, number> = {
  "\u96f6": 0,
  "\u3007": 0,
  "\u4e00": 1,
  "\u4e8c": 2,
  "\u4e24": 2,
  "\u4e09": 3,
  "\u56db": 4,
  "\u4e94": 5,
  "\u516d": 6,
  "\u4e03": 7,
  "\u516b": 8,
  "\u4e5d": 9,
};

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

function extractJsonArray(text: string) {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in model response");
  }

  return cleaned.slice(start, end + 1);
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function stripTrailingPageNumber(line: string) {
  return normalizeLine(
    line
      .replace(/\.{2,}\s*\d{1,5}\s*$/g, "")
      .replace(/\s+\d{1,5}\s*$/g, "")
      .replace(/^[-:\u2013\u2014\uFF1A\s]+/, "")
      .replace(/[-:\u2013\u2014\uFF1A\s]+$/, "")
  );
}

function parseRomanNumeral(value: string) {
  const normalized = value.toUpperCase().trim();
  if (!/^[IVXLCDM]+$/.test(normalized)) return null;

  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let total = 0;
  let prev = 0;
  for (let i = normalized.length - 1; i >= 0; i--) {
    const current = map[normalized[i]];
    if (current < prev) {
      total -= current;
    } else {
      total += current;
      prev = current;
    }
  }

  if (total <= 0 || total > 300) return null;
  return total;
}

function parseChineseNumeral(value: string) {
  const cleaned = value.replace(/[\u7b2c\u7ae0\u8282\u56de\u7bc7\u5377\u90e8\s]/g, "");
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return Number(cleaned);

  const unitMap: Record<string, number> = {
    "\u5341": 10,
    "\u767e": 100,
    "\u5343": 1000,
  };

  let total = 0;
  let currentDigit = 0;

  for (const char of cleaned) {
    if (char in CHINESE_DIGITS) {
      currentDigit = CHINESE_DIGITS[char];
      continue;
    }

    if (char in unitMap) {
      const unit = unitMap[char];
      const base = currentDigit === 0 ? 1 : currentDigit;
      total += base * unit;
      currentDigit = 0;
      continue;
    }

    return null;
  }

  total += currentDigit;
  return total > 0 ? total : null;
}

function parseChapterNumberToken(token: string) {
  const cleaned = token.trim().replace(/[.\u3001\u3002:\uFF1A)\]]+$/g, "");
  if (!cleaned) return null;

  if (/^\d+$/.test(cleaned)) {
    const value = Number(cleaned);
    return value > 0 && value <= 500 ? value : null;
  }

  const wordValue = ENGLISH_WORD_NUMBERS[cleaned.toLowerCase()];
  if (wordValue) return wordValue;

  const romanValue = parseRomanNumeral(cleaned);
  if (romanValue) return romanValue;

  const chineseValue = parseChineseNumeral(cleaned);
  if (chineseValue) return chineseValue;

  return null;
}

function isChapterHeadingLine(line: string) {
  if (
    /^chapter\s+([0-9]+|[ivxlcdm]+|[a-z-]+)\b(?:\s*[-:\u2013\u2014\uFF1A.]?\s*(.*?))?$/i.test(line)
  ) {
    return true;
  }

  if (
    /^\u7b2c\s*([0-9\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e24\u3007\u96f6]+)\s*[\u7ae0\u8282\u56de\u7bc7\u5377\u90e8]\s*[-:\u2013\u2014\uFF1A.]?\s*(.*?)$/u.test(
      line
    )
  ) {
    return true;
  }

  if (/^(\d{1,3})\s*[.)\u3001]\s*(.{3,120})$/.test(line)) {
    return true;
  }

  return false;
}

function isLikelyIncompleteTitle(title: string, sourceLine: string) {
  if (!title.trim()) return true;

  const normalizedTitle = normalizeLine(title);
  const normalizedLine = normalizeLine(sourceLine);

  if (/[:\-\u2013\u2014]$/.test(normalizedLine)) return true;
  if (normalizedTitle.split(/\s+/).length <= 2) return true;

  const lower = normalizedTitle.toLowerCase();
  if (/\b(and|or|of|to|for|in|on|with|the|a|an|beyond|your|my|our|their|its|from|into)$/.test(lower)) {
    return true;
  }

  return false;
}

function isLikelyTitleContinuationLine(line: string) {
  const cleaned = normalizeLine(line);
  if (!cleaned) return false;
  if (isChapterHeadingLine(cleaned)) return false;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(cleaned)) return false;
  if (cleaned.length > 90) return false;
  if (/[.!?;]\s*$/.test(cleaned)) return false;

  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 8) return false;

  return true;
}

function isStrongContinuationCandidate(line: string) {
  const cleaned = normalizeLine(line);
  if (!cleaned) return false;
  if (!isLikelyTitleContinuationLine(cleaned)) return false;

  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 3) return false;

  return /^[A-Z0-9]/.test(cleaned);
}

function dedupeAndNormalizeToc(items: TableOfContentsItem[]) {
  const seen = new Set<string>();
  const deduped: TableOfContentsItem[] = [];

  for (const item of items) {
    const title = stripTrailingPageNumber(item.title);
    if (!title) continue;

    const key = `${item.chapterNumber}-${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    deduped.push({
      chapterNumber: item.chapterNumber,
      title,
      description: item.description?.trim() || `Key points from ${title}`,
      startOffset: item.startOffset,
    });
  }

  deduped.sort((a, b) => {
    if (typeof a.startOffset === "number" && typeof b.startOffset === "number") {
      return a.startOffset - b.startOffset;
    }
    if (typeof a.startOffset === "number") return -1;
    if (typeof b.startOffset === "number") return 1;
    return a.chapterNumber - b.chapterNumber;
  });

  return deduped.slice(0, 25).map((item, index) => ({
    ...item,
    chapterNumber: index + 1,
  }));
}

function sanitizeModelToc(data: unknown): TableOfContentsItem[] {
  if (!Array.isArray(data)) return [];

  const parsed: TableOfContentsItem[] = [];
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const titleRaw =
      typeof record.title === "string"
        ? record.title
        : typeof record.chapterTitle === "string"
          ? record.chapterTitle
          : "";

    if (!titleRaw.trim()) continue;

    const chapterNumberRaw =
      typeof record.chapterNumber === "number"
        ? record.chapterNumber
        : typeof record.chapterNumber === "string"
          ? parseChapterNumberToken(record.chapterNumber)
          : null;

    parsed.push({
      chapterNumber: chapterNumberRaw && chapterNumberRaw > 0 ? chapterNumberRaw : i + 1,
      title: titleRaw.trim(),
      description:
        typeof record.description === "string"
          ? record.description
          : `Key points from ${stripTrailingPageNumber(titleRaw)}`,
    });
  }

  return dedupeAndNormalizeToc(parsed);
}

function extractChaptersFromText(text: string): TableOfContentsItem[] {
  if (!text.trim()) return [];

  const lineMatches = Array.from(text.matchAll(/[^\r\n]+/g));
  const chapters: TableOfContentsItem[] = [];

  for (let i = 0; i < lineMatches.length; i++) {
    const line = normalizeLine(lineMatches[i][0]);
    if (!line) continue;

    let chapterNumber: number | null = null;
    let title = "";
    let consumeLines = 0;

    let match = line.match(
      /^chapter\s+([0-9]+|[ivxlcdm]+|[a-z-]+)\b(?:\s*[-:\u2013\u2014\uFF1A.]?\s*(.*?))?(?:\s*(?:\.{2,}\s*\d{1,5}))?$/i
    );

    if (match) {
      chapterNumber = parseChapterNumberToken(match[1]);
      title = stripTrailingPageNumber(match[2] || "");
    } else {
      match = line.match(
        /^\u7b2c\s*([0-9\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e24\u3007\u96f6]+)\s*[\u7ae0\u8282\u56de\u7bc7\u5377\u90e8]\s*[-:\u2013\u2014\uFF1A.]?\s*(.*?)(?:\s*(?:\.{2,}\s*\d{1,5}))?$/u
      );

      if (match) {
        chapterNumber = parseChapterNumberToken(match[1]);
        title = stripTrailingPageNumber(match[2] || "");
      } else {
        match = line.match(/^(\d{1,3})\s*[.)\u3001]\s*(.{3,120})$/);
        if (match) {
          chapterNumber = parseChapterNumberToken(match[1]);
          title = stripTrailingPageNumber(match[2]);
        }
      }
    }

    if (!chapterNumber) continue;

    // Many PDF headings are wrapped across lines. Merge short continuation lines for full titles.
    const titleParts = title ? [title] : [];
    let scanIndex = i + 1;
    while (scanIndex < lineMatches.length && titleParts.length < 4) {
      const continuationLine = normalizeLine(lineMatches[scanIndex][0]);
      if (!isLikelyTitleContinuationLine(continuationLine)) break;

      const shouldAppendContinuation =
        !titleParts.length ||
        isLikelyIncompleteTitle(titleParts.join(" "), line) ||
        (titleParts.length === 1 && isStrongContinuationCandidate(continuationLine));

      if (shouldAppendContinuation) {
        titleParts.push(stripTrailingPageNumber(continuationLine));
        consumeLines += 1;
        scanIndex += 1;
        continue;
      }
      break;
    }

    title = stripTrailingPageNumber(titleParts.join(" "));
    if (!title) title = `Chapter ${chapterNumber}`;

    const startOffset = lineMatches[i].index ?? undefined;
    chapters.push({
      chapterNumber,
      title,
      description: `Key points from ${title}`,
      startOffset,
    });

    i += consumeLines;
  }

  return dedupeAndNormalizeToc(chapters);
}

function buildChapterExtractionSource(text: string) {
  if (text.length <= MAX_CHAPTER_EXTRACTION_CHARS) return text;

  const headLength = Math.floor(MAX_CHAPTER_EXTRACTION_CHARS * 0.75);
  const tailLength = MAX_CHAPTER_EXTRACTION_CHARS - headLength;

  return [
    text.slice(0, headLength),
    "\n\n[...content truncated for extraction...]\n\n",
    text.slice(-tailLength),
  ].join("");
}

function injectStartOffsetsFromText(toc: TableOfContentsItem[], text: string) {
  if (!text.trim()) return toc;

  let searchFrom = 0;
  const withOffsets = toc.map((item) => {
    if (typeof item.startOffset === "number") {
      searchFrom = Math.max(searchFrom, item.startOffset + 1);
      return item;
    }

    const lowerText = text.toLowerCase();
    const lowerTitle = item.title.toLowerCase();
    const idx = lowerText.indexOf(lowerTitle, searchFrom);
    if (idx !== -1) {
      searchFrom = idx + lowerTitle.length;
      return { ...item, startOffset: idx };
    }

    return item;
  });

  return withOffsets;
}

function getChapterSpecificContent(
  fullText: string,
  chapter: TableOfContentsItem,
  nextChapter?: TableOfContentsItem
) {
  if (!fullText.trim()) return "";

  const maxChapterChars = 8000;

  if (typeof chapter.startOffset === "number") {
    const start = chapter.startOffset;
    const end =
      typeof nextChapter?.startOffset === "number" && nextChapter.startOffset > start
        ? nextChapter.startOffset
        : start + maxChapterChars;

    const sliced = fullText.slice(start, Math.min(fullText.length, end));
    if (sliced.trim().length >= 400) return sliced;
  }

  const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const titleRegex = new RegExp(escapedTitle, "i");
  const match = titleRegex.exec(fullText);
  if (match?.index !== undefined) {
    return fullText.slice(match.index, Math.min(fullText.length, match.index + maxChapterChars));
  }

  return fullText.slice(0, Math.min(fullText.length, maxChapterChars));
}

function tokenizeForRetrieval(text: string) {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return matches.filter((token) => {
    if (RETRIEVAL_STOPWORDS.has(token)) return false;
    if (/^[a-z0-9]$/i.test(token)) return false;
    if (token.length > 60) return false;
    return true;
  });
}

function countTokens(tokens: string[]) {
  const counts: Record<string, number> = {};
  for (const token of tokens) {
    counts[token] = (counts[token] || 0) + 1;
  }
  return counts;
}

function chunkTextForRag(text: string) {
  if (!text.trim()) return [];

  const chunks: RagChunk[] = [];
  let cursor = 0;
  let chunkId = 1;

  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + RAG_CHUNK_SIZE);

    if (end < text.length) {
      const nearestBreak = text.lastIndexOf("\n", end);
      if (nearestBreak > cursor + Math.floor(RAG_CHUNK_SIZE * 0.55)) {
        end = nearestBreak;
      }
    }

    if (end <= cursor) end = Math.min(text.length, cursor + RAG_CHUNK_SIZE);

    const chunkText = text.slice(cursor, end).trim();
    if (chunkText) {
      const tokens = tokenizeForRetrieval(chunkText);
      chunks.push({
        id: chunkId,
        start: cursor,
        end,
        text: chunkText,
        tokenLength: Math.max(tokens.length, 1),
        tokenCounts: countTokens(tokens),
      });
      chunkId += 1;
    }

    if (end >= text.length) break;

    const nextCursor = end - RAG_CHUNK_OVERLAP;
    cursor = nextCursor > cursor ? nextCursor : end;
  }

  return chunks;
}

function buildRagIndex(text: string): RagIndex {
  const chunks = chunkTextForRag(text);
  const df = new Map<string, number>();

  for (const chunk of chunks) {
    const uniqueTokens = new Set(Object.keys(chunk.tokenCounts));
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  const totalDocs = Math.max(chunks.length, 1);
  for (const [token, docFreq] of df.entries()) {
    const score = Math.log((totalDocs - docFreq + 0.5) / (docFreq + 0.5) + 1);
    idf.set(token, score);
  }

  const totalTokenLength = chunks.reduce((sum, chunk) => sum + chunk.tokenLength, 0);
  const averageTokenLength = chunks.length > 0 ? totalTokenLength / chunks.length : 1;

  return { chunks, idf, averageTokenLength };
}

function scoreChunkBm25(index: RagIndex, chunk: RagChunk, queryTokenCounts: Record<string, number>) {
  const k1 = 1.2;
  const b = 0.75;
  const avgLen = Math.max(index.averageTokenLength, 1);
  let score = 0;

  for (const [token, queryTf] of Object.entries(queryTokenCounts)) {
    const tf = chunk.tokenCounts[token] || 0;
    if (!tf) continue;

    const idf = index.idf.get(token) || Math.log((index.chunks.length + 0.5) / 1.5);
    const denominator = tf + k1 * (1 - b + b * (chunk.tokenLength / avgLen));
    const normalizedTf = (tf * (k1 + 1)) / denominator;

    score += idf * normalizedTf * (1 + Math.log1p(queryTf));
  }

  return score;
}

function retrieveRagChunks(index: RagIndex, query: string, options: RetrieveOptions = {}) {
  if (index.chunks.length === 0) return [];

  const queryTokens = tokenizeForRetrieval(query);
  if (queryTokens.length === 0) return [];
  const queryTokenCounts = countTokens(queryTokens);

  const hasRange =
    typeof options.startOffset === "number" && Number.isFinite(options.startOffset);
  const rangeStart = hasRange ? options.startOffset! : 0;
  const rangeEnd =
    typeof options.endOffset === "number" && Number.isFinite(options.endOffset)
      ? options.endOffset
      : Number.POSITIVE_INFINITY;

  const overlapRange = (chunk: RagChunk) => chunk.end > rangeStart && chunk.start < rangeEnd;
  const rangeChunks = hasRange ? index.chunks.filter(overlapRange) : [];
  const candidatePool = rangeChunks.length >= 2 ? rangeChunks : index.chunks;

  const scored = candidatePool
    .map((chunk) => {
      let score = scoreChunkBm25(index, chunk, queryTokenCounts);
      if (hasRange && overlapRange(chunk)) score += 0.25;
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  const topK = options.topK || RAG_TOP_K;
  const positive = scored.filter((item) => item.score > 0).slice(0, topK).map((item) => item.chunk);
  if (positive.length > 0) return positive;

  return scored.slice(0, topK).map((item) => item.chunk);
}

function buildEvidenceContext(chunks: RagChunk[], fallbackText: string) {
  const evidence = chunks
    .slice(0, RAG_TOP_K)
    .map((chunk, index) => {
      const snippet = chunk.text.slice(0, RAG_SNIPPET_CHARS);
      return `Evidence ${index + 1} (chunk ${chunk.id}, offset ${chunk.start}-${chunk.end}):\n${snippet}`;
    });

  if (evidence.length === 0 && fallbackText.trim()) {
    evidence.push(
      `Evidence 1 (boundary excerpt):\n${fallbackText.slice(0, RAG_SNIPPET_CHARS * 2)}`
    );
  }

  return evidence.join("\n\n");
}

async function extractRealTocWithModel(
  bookTitle: string,
  bookAuthor: string,
  sourceText: string
): Promise<TableOfContentsItem[]> {
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "Extract existing chapter headings from the provided book text. Do not invent chapters. Return ONLY a JSON array.",
      },
      {
        role: "user",
        content: `Book: "${bookTitle}" by ${bookAuthor}
Task:
- Extract real chapter headings that actually appear in the text.
- Keep title wording close to the original.
- If chapter number exists, use it; otherwise assign sequential numbers.
- Return ONLY JSON array in this format:
[{"chapterNumber":1,"title":"Chapter Title","description":"Brief chapter focus"}]
- If no clear chapters exist, return [].

Book text for extraction:
${sourceText}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1200,
  });

  const tocText = completion.choices[0].message.content || "[]";
  const jsonText = extractJsonArray(tocText);
  return sanitizeModelToc(JSON.parse(jsonText));
}

async function generateFallbackToc(
  bookTitle: string,
  bookAuthor: string,
  sourceText: string
): Promise<TableOfContentsItem[]> {
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "Create a logical table of contents for a book summary. Return ONLY a JSON array.",
      },
      {
        role: "user",
        content: `Create a table of contents (chapter list) for "${bookTitle}" by ${bookAuthor}.
Use the content below to infer major sections.
Return ONLY a JSON array of objects with this structure:
[{"chapterNumber":1,"title":"Chapter Title","description":"Brief description"}]
Create 8-12 logical chapters.

Book Content:
${sourceText}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 1000,
  });

  const tocText = completion.choices[0].message.content || "[]";
  const jsonText = extractJsonArray(tocText);
  return sanitizeModelToc(JSON.parse(jsonText));
}

async function isReadableFile(filePath: string) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function normalizePdfRelativePath(urlOrPath: string) {
  return urlOrPath
    .replace(/[?#].*$/, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

async function resolveBookPdfPath(originalPdfUrl?: string | null, originalPdfPath?: string | null) {
  const candidatePaths: string[] = [];

  if (originalPdfPath && originalPdfPath.trim()) {
    const rawPath = originalPdfPath.trim();
    candidatePaths.push(rawPath);
    candidatePaths.push(join(process.cwd(), rawPath));
  }

  if (originalPdfUrl && originalPdfUrl.trim()) {
    const relativeUrlPath = normalizePdfRelativePath(originalPdfUrl.trim());
    candidatePaths.push(join(process.cwd(), "public", relativeUrlPath));
  }

  for (const candidate of candidatePaths) {
    if (await isReadableFile(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function extractTextFromPdfFile(pdfPath: string) {
  const scriptPath = join(process.cwd(), "scripts", "extract-pdf-text.cjs");
  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, pdfPath], {
    maxBuffer: 20 * 1024 * 1024,
  });

  if (stderr?.trim()) {
    console.warn("extract-pdf-text stderr:", stderr);
  }

  const output = JSON.parse(stdout) as { text?: string; error?: string };
  if (output.error) {
    throw new Error(output.error);
  }

  return String(output.text || "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const bookId = Number(body?.bookId);
    if (!Number.isInteger(bookId)) {
      return NextResponse.json({ error: "Book Id is required" }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (message: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message })}\n\n`));
        };

        try {
          sendMessage("Starting summary generation...");

          let fullBookText = "";
          const descriptionText = String(book.description || "").trim();

          if (book.originalPdfUrl || book.originalPdfPath) {
            sendMessage("Extracting text from PDF...");
            try {
              const pdfPath = await resolveBookPdfPath(book.originalPdfUrl, book.originalPdfPath);
              if (!pdfPath) {
                throw new Error(
                  `PDF file not found. originalPdfUrl=${book.originalPdfUrl || "null"}, originalPdfPath=${book.originalPdfPath || "null"}`
                );
              }

              sendMessage(`Using PDF file: ${pdfPath}`);
              fullBookText = (await extractTextFromPdfFile(pdfPath)).trim();
              sendMessage(`Extracted ${fullBookText.length} characters from PDF`);
            } catch (error) {
              console.error("PDF extraction error:", error);
              sendMessage("Warning: Could not extract PDF text.");
            }
          }

          if (!fullBookText.trim()) {
            if (descriptionText.length >= 500) {
              sendMessage("Using book description as source text.");
              fullBookText = descriptionText;
            } else {
              throw new Error(
                "No usable source text. PDF extraction failed and description is too short."
              );
            }
          }

          const summaryInputText = (fullBookText || "").slice(0, MAX_SUMMARY_INPUT_CHARS);

          sendMessage("Generating main summary...");
          const summaryCompletion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional book summarizer. Create concise, engaging summaries that capture the key insights and main ideas of books.",
              },
              {
                role: "user",
                content: `Create a comprehensive summary for the following book:
Title: ${book.title}
Author: ${book.author}
Book Content:
${summaryInputText}
Please provide:
1. A main summary (150-200 words) that captures the essence of the book
2. 5-7 key takeaways (bullet points)
3. Target audience
4. Main themes`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          const summaryText = summaryCompletion.choices[0].message.content || "";

          const chapterExtractionSource = buildChapterExtractionSource(fullBookText || summaryInputText);
          sendMessage("Detecting real chapters from text...");

          let tableOfContents = extractChaptersFromText(chapterExtractionSource);
          if (tableOfContents.length >= MIN_RELIABLE_CHAPTERS) {
            sendMessage(`Detected ${tableOfContents.length} chapters via heading rules`);
          } else {
            sendMessage("Rule-based chapter detection was weak. Using model extraction...");
            try {
              const extractedByModel = await extractRealTocWithModel(
                book.title,
                book.author,
                chapterExtractionSource
              );
              if (extractedByModel.length >= MIN_RELIABLE_CHAPTERS) {
                tableOfContents = extractedByModel;
                sendMessage(`Model extracted ${tableOfContents.length} chapter headings`);
              }
            } catch (error) {
              console.error("Model TOC extraction error:", error);
            }
          }

          if (tableOfContents.length === 0) {
            sendMessage("No reliable chapters detected. Generating fallback TOC...");
            try {
              tableOfContents = await generateFallbackToc(
                book.title,
                book.author,
                summaryInputText || chapterExtractionSource
              );
              sendMessage(`Fallback TOC generated: ${tableOfContents.length} chapters`);
            } catch (error) {
              console.error("Fallback TOC generation error:", error);
            }
          }

          if (tableOfContents.length === 0) {
            tableOfContents = [
              { chapterNumber: 1, title: "Introduction", description: "Overview of the book" },
              { chapterNumber: 2, title: "Main Content", description: "Key concepts and ideas" },
              {
                chapterNumber: 3,
                title: "Conclusion",
                description: "Final thoughts and takeaways",
              },
            ];
          }

          tableOfContents = dedupeAndNormalizeToc(
            injectStartOffsetsFromText(tableOfContents, fullBookText || summaryInputText)
          );

          sendMessage("Building lightweight retrieval index...");
          const ragIndex = buildRagIndex(fullBookText || summaryInputText);
          sendMessage(`RAG index ready: ${ragIndex.chunks.length} chunks`);

          sendMessage("Generating chapter summaries with retrieval...");
          const chaptersWithSummaries: Array<TableOfContentsItem & { detailedSummary: string }> = [];

          for (let i = 0; i < tableOfContents.length; i++) {
            const chapter = tableOfContents[i];
            const nextChapter = tableOfContents[i + 1];
            const chapterBoundaryText = getChapterSpecificContent(
              fullBookText || summaryInputText,
              chapter,
              nextChapter
            );

            const ragQuery = `${book.title}
${book.author}
${chapter.title}
${chapter.description}`;

            let evidenceChunks = retrieveRagChunks(ragIndex, ragQuery, {
              topK: RAG_TOP_K,
              startOffset: chapter.startOffset,
              endOffset: nextChapter?.startOffset,
            });

            if (evidenceChunks.length < 2 && chapterBoundaryText.trim()) {
              evidenceChunks = retrieveRagChunks(
                ragIndex,
                `${ragQuery}\n${chapterBoundaryText.slice(0, 1200)}`,
                { topK: RAG_TOP_K }
              );
            }

            const evidenceContext = buildEvidenceContext(evidenceChunks, chapterBoundaryText);
            sendMessage(
              `Chapter ${chapter.chapterNumber}: retrieved ${evidenceChunks.length} evidence chunks`
            );

            try {
              const chapterSummaryCompletion = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a professional book summarizer. Use only the provided evidence context to produce accurate chapter summaries.",
                  },
                  {
                    role: "user",
                    content: `Write a professional chapter summary in about 150 words.
Book: "${book.title}" by ${book.author}
Chapter ${chapter.chapterNumber}: ${chapter.title}
Chapter focus: ${chapter.description}

Evidence context:
${evidenceContext}

Rules:
1) Base the summary strictly on evidence context.
2) Do not invent facts not present in evidence.
3) Keep the summary concise, coherent, and actionable.
4) Return only the summary text.`,
                  },
                ],
                temperature: 0.4,
                max_tokens: 320,
              });

              const detailedSummary =
                chapterSummaryCompletion.choices[0].message.content?.trim() ||
                chapter.description ||
                `Summary for ${chapter.title}`;

              chaptersWithSummaries.push({
                ...chapter,
                detailedSummary,
              });
              sendMessage(`Chapter ${chapter.chapterNumber} summary completed`);
            } catch (error) {
              console.error(
                `Error generating summary for chapter ${chapter.chapterNumber}:`,
                error
              );
              chaptersWithSummaries.push({
                ...chapter,
                detailedSummary: chapter.description || `Summary for ${chapter.title}`,
              });
              sendMessage(`Warning: using brief description for chapter ${chapter.chapterNumber}`);
            }
          }

          sendMessage("Saving summary to database...");

          const tableOfContentsForStorage = tableOfContents.map((chapter) => ({
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            description: chapter.description,
          }));

          await prisma.$transaction(async (tx) => {
            await tx.bookChapter.deleteMany({
              where: { bookId: book.id },
            });

            await tx.bookSummary.upsert({
              where: { bookId: book.id },
              update: {
                mainSummary: summaryText,
                tableOfContents: tableOfContentsForStorage,
              },
              create: {
                bookId: book.id,
                mainSummary: summaryText,
                tableOfContents: tableOfContentsForStorage,
              },
            });

            if (chaptersWithSummaries.length > 0) {
              await tx.bookChapter.createMany({
                data: chaptersWithSummaries.map((chapter, index) => ({
                  bookId: book.id,
                  chapterNumber: chapter.chapterNumber,
                  chapterTitle: chapter.title,
                  chapterSummary: chapter.detailedSummary,
                  audioUrl: null,
                  audioDuration: 0,
                  displayOrder: index + 1,
                })),
              });
            }

            await tx.book.update({
              where: { id: book.id },
              data: { summaryGenerated: true },
            });
          });

          sendMessage("Summary generation completed");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: "Completed", completed: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Error generating summary", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: "Failed", error: true })}\n\n`)
          );
          controller.close();
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
    console.error("Error generating summary", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
