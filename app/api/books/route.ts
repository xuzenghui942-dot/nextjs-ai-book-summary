import { auth } from "@/lib/auth";
import { getPublishedBooksWithMeta } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const result = await getPublishedBooksWithMeta({
      userId: session?.user?.id,
      search,
      categoryId: category ? parseInt(category) : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching books", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
