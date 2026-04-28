import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.userReadingHistory.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: {
        lastAccessed: "desc",
      },
      take: 10,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching reading history", error);
    return NextResponse.json({ error: "Failed to fetch reading history" }, { status: 500 });
  }
}
