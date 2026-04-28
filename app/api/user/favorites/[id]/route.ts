import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bookId = parseInt(id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid favorite id" }, { status: 400 });
    }
    // Find the favorite
    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
    });
    if (!favorite) {
      return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
    }
    // 从 喜欢(favorite) 表里面删除
    await prisma.userFavorite.delete({
      where: {
        id: favorite.id,
      },
    });
    return NextResponse.json({ success: true, message: "Remove from favorites" });
  } catch (error) {
    console.error("Error removing favorite", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
