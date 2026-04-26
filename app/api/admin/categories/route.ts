import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "console";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
/** 前端请求 -> Next.js route.ts ->auth校验 -> prisma查数据库 -> 返回JSON */
/**
 * NextRequest前端发来的请求(GET /api/admin/categories?page=1
 * Authorization: Bearer xxx Cookie: token=abc)可以用来拿URL headers请求头 cookies
 * HTTP状态码：200 正常 401未登录 500服务器错误
 */
/**
 * 这段代码其实是 POV GET部分
 * 1. 前端请求
 * 2. request 被传进来
 * 3. auth() 判断是不是管理员
 * 4. prisma 去数据库查categories
 * 5. NextResponse 返回数据
 */
/** MAIN 现在补全POST方法 在admin/categories/new/page.tsx 里面调用 用来创建新的分类 */
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export async function GET(request: NextRequest) {
  try {
    const session = await auth(); // 获取当前登录用户
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const categories = await prisma.category.findMany({
      // 查数据库里面的表
      orderBy: {
        displayOrder: "asc", // 按照displayOrder字段升序排列
      },
      include: {
        // 返回要包括的数据
        _count: {
          select: {
            books: true,
          },
        },
      },
    });
    return NextResponse.json(categories); // 返回给前端的JSON数据
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    // 验证 request 请求体 POV (表单数据)
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      // POV 如果认证信息错误
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          // MAIN key 是 issue.path[0].toString() = issue.message
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      return NextResponse.json({ error: "Validation filed", errors }, { status: 400 });
    }
    const data = validation.data;
    // generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    // 检查slug是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }
    // 真正的在数据库中压入新分类
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: slug,
        description: data.description,
        icon: data.icon,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.log("Error creating category:", error);
  }
}
