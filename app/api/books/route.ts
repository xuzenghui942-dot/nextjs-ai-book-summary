import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categoryId = parseInt(category);
    }

    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    const bookIds = books.map((book) => book.id);

    const [ratings, favorites] = await Promise.all([
      prisma.bookReview.groupBy({
        by: ["bookId"],
        where: {
          bookId: { in: bookIds },
          isApproved: true,
        },
        _avg: {
          rating: true,
        },
      }),
      session?.user
        ? prisma.userFavorite.findMany({
            where: {
              userId: session.user.id,
              bookId: { in: bookIds },
            },
            select: {
              bookId: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const ratingMap = new Map(ratings.map((r) => [r.bookId, r._avg.rating || 0]));
    const favoriteSet = new Set(favorites.map((f) => f.bookId));

    const booksWithRatings = books.map((book) => ({
      ...book,
      averageRating: ratingMap.get(book.id) || 0,
      isFavorited: favoriteSet.has(book.id),
    }));

    return NextResponse.json({
      books: booksWithRatings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching books", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
