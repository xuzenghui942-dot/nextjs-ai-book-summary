import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type GetPublishedBooksWithMetaInput = {
  userId?: string;
  search?: string;
  categoryId?: number;
  page: number;
  limit: number;
};

function buildAverageRatingMap(
  ratings: Array<{ bookId: number; _avg: { rating: number | null } }>,
) {
  return new Map(ratings.map((rating) => [rating.bookId, rating._avg.rating ?? 0]));
}

export async function getPublishedBooksWithMeta({
  userId,
  search,
  categoryId,
  page,
  limit,
}: GetPublishedBooksWithMetaInput) {
  const where: Prisma.BookWhereInput = {
    isPublished: true,
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const skip = (page - 1) * limit;

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

  if (bookIds.length === 0) {
    return {
      books: [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

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
    userId
      ? prisma.userFavorite.findMany({
          where: {
            userId,
            bookId: { in: bookIds },
          },
          select: {
            bookId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const averageRatingByBookId = buildAverageRatingMap(ratings);
  const favoritedBookIds = new Set(favorites.map((favorite) => favorite.bookId));

  return {
    books: books.map((book) => ({
      ...book,
      averageRating: averageRatingByBookId.get(book.id) ?? 0,
      isFavorited: favoritedBookIds.has(book.id),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function getUserFavoritesWithMeta(userId: string) {
  const favorites = await prisma.userFavorite.findMany({
    where: {
      userId,
    },
    include: {
      book: {
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
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const bookIds = favorites.map((favorite) => favorite.bookId);

  if (bookIds.length === 0) {
    return [];
  }

  const ratings = await prisma.bookReview.groupBy({
    by: ["bookId"],
    where: {
      bookId: { in: bookIds },
      isApproved: true,
    },
    _avg: {
      rating: true,
    },
  });

  const averageRatingByBookId = buildAverageRatingMap(ratings);

  return favorites.map((favorite) => ({
    id: favorite.id,
    bookId: favorite.bookId,
    createdAt: favorite.createdAt,
    book: {
      ...favorite.book,
      averageRating: averageRatingByBookId.get(favorite.bookId) ?? 0,
      isFavorited: true,
    },
  }));
}
