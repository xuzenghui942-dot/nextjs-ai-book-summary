import { auth } from "@/lib/auth";
import { getPublishedBooksWithMeta } from "@/lib/db/queries";
import { booksQuerySchema } from "@/lib/validations/book";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const validation = booksQuerySchema.safeParse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      category: request.nextUrl.searchParams.get("category") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid books query",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { search, category, page, limit } = validation.data;

    const result = await getPublishedBooksWithMeta({
      userId: session?.user?.id,
      search,
      categoryId: category,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching books", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
