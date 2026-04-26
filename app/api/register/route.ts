import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 charachters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 charachters"),
  //前端驗證是為了提升使用者體驗，讓錯誤更早出現；後端驗證才是安全邊界，因為前端可以被繞過，所以後端必須再次檢查資料格式與合法性。 (前端部分也有 minLength)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // 輸入的資訊 收到前端送來的http request body 後端把body解析成js物件
    // Validate input
    const validatedData = registerSchema.parse(body); // 驗證資料格式

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash Password  先把密碼做成hash 再寫入資訊庫 (不能存明文密碼 不然數據庫外泄的時候使用者密碼會直接暴露 )
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create User
    const user = await prisma.user.create({
      // model的大寫的首字母會自動小寫
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        passwordHash, // 這種不能傳回給前端
        role: "USER",
        subscriptionTier: "FREE",
        subscriptionStatus: "ACTIVE",
      },
      select: {
        // 創建完成后傳回的data的value
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went worng. Please try again" },
      { status: 500 }
    );
  }
}
