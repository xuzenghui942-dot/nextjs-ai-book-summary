import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { readingHistoryPatchSchema } from "@/lib/validations/reading-history";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

function parseBookId(value: string) {
  const bookId = Number(value);
  return Number.isInteger(bookId) && bookId > 0 ? bookId : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId: bookIdParam } = await context.params;
    const bookId = parseBookId(bookIdParam);

    if (!bookId) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const history = await prisma.userReadingHistory.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching reading progress", error);
    return NextResponse.json({ error: "Failed to fetch reading progress" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId: bookIdParam } = await context.params;
    const bookId = parseBookId(bookIdParam);

    if (!bookId) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const body = await request.json();
    const validation = readingHistoryPatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid reading history request",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const history = await prisma.userReadingHistory.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
      create: {
        userId: session.user.id,
        bookId,
        chapterIndex: validation.data.chapterIndex,
        audioPosition: validation.data.audioPosition,
        completionPercentage: validation.data.completionPercentage,
        lastAccessed: new Date(),
      },
      update: {
        chapterIndex: validation.data.chapterIndex,
        audioPosition: validation.data.audioPosition,
        completionPercentage: validation.data.completionPercentage,
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error saving reading progress", error);
    return NextResponse.json({ error: "Failed to save reading progress" }, { status: 500 });
  }
}
