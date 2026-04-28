import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getUserFavoritesWithMeta } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const favoriteSchema = z.object({
  bookId: z.number().positive(),
});
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await getUserFavoritesWithMeta(session.user.id);

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}
// Post(增加数据) 在 喜欢 列表里面 MAIN
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validation = favoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invaild request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }
    const { bookId } = validation.data;
    // 检查book是否存在和发行
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isPublished: true,
      },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found or not published" }, { status: 404 });
    }
    // 检查是否这个书本依旧被喜欢
    const existingFavorite = await prisma.userFavorite.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
    });
    if (existingFavorite) {
      return NextResponse.json(
        {
          error: "Book already in favorites",
        },
        {
          status: 400,
        }
      );
    }
    /// Add this book to favorites
    const favorite = await prisma.userFavorite.create({
      data: {
        userId: session.user.id,
        bookId,
      },
      include: {
        book: {
          include: {
            category: true,
          },
        },
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite", error);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
