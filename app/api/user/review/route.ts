import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
  bookId: z.number().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
});
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    //console.log("Review submission data",body)
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.issues
        .map((issue) => `${issue.path.join(".")}:${issue.message}`)
        .join(",");
      console.error("Validation errors:", validation.error.issues);
      return NextResponse.json(
        { error: `Invalida requeset: ${errorMessages}`, details: validation.error.issues },
        { status: 400 }
      );
    }
    const { bookId, rating, comment } = validation.data;
    // 检查book是否已经存在
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isPublished: true,
      },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    // 然后继续检查用户是否已经看了这本书(不能重复评论)
    const existingReview = await prisma.bookReview.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
    });
    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewd this book" }, { status: 400 });
    }
    // 检查用户是否拥有高级订阅（验证购买）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });
    const isVerifiedPurchase = user?.subscriptionTier !== "FREE";
    // 为待审核项创建 评论
    const review = await prisma.bookReview.create({
      data: {
        userId: session.user.id,
        bookId,
        rating,
        reviewText: comment,
        isApproved: false, // 评论需要admin管理员的同意
        isVerifiedPurchase,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review ", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
