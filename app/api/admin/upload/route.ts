// import { auth } from "@/lib/auth";
// import { NextRequest, NextResponse } from "next/server";
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";
// import { existsSync } from "fs";
// /**把浏览器传上来的文件，保存到项目的 public/uploads 目录中，并返回一个可以访问的 URL。 */
// /**
//  * MAIN
//  * 1)从请求里拿到file
//  * 2)判断有没有file
//  * 3)读取出file内容
//  * 4)转成服务器能处理的格式
//  * 5)写入硬盘
//  */
// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth();
//     const formData = await request.formData(); // POV 从请求里拿到表单数据
//     const file = formData.get("file") as File; // POV 从表单数据里拿到上传的文件
//     const type = formData.get("type") as string; // CM 前端传来的字段类型
//     if (type === "payment_proof") {
//       if (!session?.user) {
//         return NextResponse.json({ error: "Unauthoried" }, { status: 401 });
//       } else {
//         // 为了 cover 和 pdf 必须是 管理员的
//         if (!session?.user || session.user.role !== "ADMIN") {
//           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }
//       }
//     } // CM 鉴权

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }
//     const bytes = await file.arrayBuffer(); // 把文件内容读出来
//     const buffer = Buffer.from(bytes); // 转成Node.js MAIN 可以拿去写文件的格式
//     let uploadDir: string;
//     let urlPath: string;
//     if (type === "cover") {
//       // MAIN 根据上传类型 决定文件保存到那个文件夹
//       uploadDir = join(process.cwd(), "public", "uploads", "covers");
//       urlPath = "covers";
//     } else if (type === "pdf") {
//       uploadDir = join(process.cwd(), "public", "uploads", "pdfs");
//       urlPath = "pdfs";
//     } else if (type === "payment_proof") {
//       uploadDir = join(process.cwd(), "public", "uploads", "payment-proofs");
//       urlPath = "payment-proofs";
//     } else {
//       return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
//     }
//     // 保存文件并返回地址
//     if (!existsSync(uploadDir)) {
//       await mkdir(uploadDir, { recursive: true });
//     }
//     // Generate unique file name
//     const timestamp = Date.now();
//     const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // 拿文件原始名字 然后把特殊字符 替换掉
//     const filename = `${timestamp}-${originalName}`;
//     const filepath = join(uploadDir, filename);
//     // save this file
//     await writeFile(filepath, buffer); // POV 写到硬盘里面
//     // POV 返回URL
//     const url = `/uploads/${urlPath}/${filename}`;
//     return NextResponse.json({ url, filename }, { status: 200 });
//   } catch (error) {
//     console.error("Error uploading file", error);
//   }
// }
import { auth } from "@/lib/auth";
// 你项目里封装好的登录认证方法
// 用它可以拿到当前登录用户的信息

import { NextRequest, NextResponse } from "next/server";
// NextRequest：前端发过来的请求对象
// NextResponse：后端返回给前端的响应对象

import { writeFile, mkdir } from "fs/promises";
// writeFile：把文件写到硬盘里
// mkdir：创建文件夹

import { join } from "path";
// join：安全地拼接路径

import { existsSync } from "fs";
// existsSync：判断某个文件夹 / 文件是否存在

/** 把浏览器传上来的文件，保存到项目的 public/uploads 目录中，并返回一个可以访问的 URL。 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth(); // 1. 获取当前登录用户

    // 上传文件时，请求体通常不是 json，而是 formData
    const formData = await request.formData(); // 2. 解析前端传来的表单数据

    // "file" 这个名字要和前端 formData.append("file", xxx) 对应
    const file = formData.get("file") as File; // 3. 从表单数据里拿到 file

    // 4. 从表单数据里拿到 type
    // type 不是文件本身，而是前端额外传来的一个字段
    // 用来告诉后端：这次上传的是 cover / pdf / payment_proof
    const type = formData.get("type") as string;

    // 5. 权限判断
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // cover 和 pdf 只允许管理员上传
    if ((type === "cover" || type === "pdf") && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. 如果没有传文件，直接报错
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 7. 读取文件内容
    // file 是“文件对象”
    // arrayBuffer() 是把文件内容读出来，变成二进制数据
    const bytes = await file.arrayBuffer();

    // 8. 把 ArrayBuffer 转成 Node.js 里的 Buffer
    // 因为 writeFile 更适合写 Buffer
    const buffer = Buffer.from(bytes);

    // 9. 先声明两个变量，后面根据 type 决定值
    let uploadDir: string; // 文件在服务器里保存的真实目录
    let urlPath: string; // 返回给前端访问时用的 URL 路径

    // 10. 根据上传类型，决定保存到哪个文件夹
    if (type === "cover") {
      // process.cwd() = 当前项目根目录
      // 最终路径类似：项目根目录/public/uploads/covers
      uploadDir = join(process.cwd(), "public", "uploads", "covers");
      urlPath = "covers";
    } else if (type === "pdf") {
      uploadDir = join(process.cwd(), "public", "uploads", "pdfs");
      urlPath = "pdfs";
    } else if (type === "payment_proof") {
      uploadDir = join(process.cwd(), "public", "uploads", "payment-proofs");
      urlPath = "payment-proofs";
    } else {
      // type 不合法，直接报错
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // 11. 如果目标文件夹不存在，就先创建
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 12. 生成一个唯一文件名，避免重名覆盖
    const timestamp = Date.now();

    // file.name 是用户上传时原始文件名
    // replace 是把特殊字符替换成 _
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // 最终文件名 = 时间戳 + 原文件名
    const filename = `${timestamp}-${originalName}`;

    // 13. 拼出最终保存路径
    const filepath = join(uploadDir, filename);

    // 14. 把文件内容真正写到硬盘
    await writeFile(filepath, buffer);

    // 15. 生成前端可访问的 URL
    // 因为文件放在 public 目录下，所以可以通过 /uploads/... 直接访问
    const url = `/uploads/${urlPath}/${filename}`;

    // 16. 返回给前端
    return NextResponse.json({ url, filename }, { status: 200 });
  } catch (error) {
    console.error("Error uploading file", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
