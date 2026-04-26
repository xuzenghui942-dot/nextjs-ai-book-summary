import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role") || "";
    const search = searchParams.get("search") || "";
    const tier = searchParams.get("tier") || "";
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (tier === "premium") {
      where.subscriptionTier = { not: "FREE" };
    } else if (tier === "free") {
      where.subscriptionTier = "FREE";
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              favorites: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (error) {
    console.error("[api/admin/users] error", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}