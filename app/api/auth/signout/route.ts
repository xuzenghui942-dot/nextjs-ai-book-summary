import { signOut } from "@/lib/auth"; // Auth.js里暴露的signOut方法 让前端调用它来退出登录
import { NextRequest, NextResponse } from "next/server";
// nextjs 给 route Handler提供的请求类型
// NextResponse 是 nextjs 给 route Handler提供的响应类型 你可以用它来构造响应对象
import { cookies } from "next/headers"; // 读取cookies
export async function POST(request: NextRequest) {
  // 只响应POST请求 request 类型声明 占位
  try {
    // 清除所有的session cookie
    const cookieStore = await cookies(); // 拿到cookie容器
    cookieStore.getAll().forEach((cookie) => {
      // 拿到所有cookie 遍历它们
      // 除了Authjs内部清一遍cookie之外 又手动便利并删除了一遍auth相关cookie
      if (
        cookie.name.startsWith("authjs") ||
        cookie.name.startsWith("next-auth")
        //Auth.js / NextAuth 相关的会话 cookie 名字通常会和这些前缀有关
      ) {
        cookieStore.delete(cookie.name);
      }
    });
    // sign out without redirect
    await signOut({ redirect: false }); // 退出登录动作只在服务端完成，不在这里直接触发页面跳转。前端:  window.location.href = "/";
    return NextResponse.json(
      { success: true },
      {
        headers: {
          // 禁止缓存的响应头
          "Cache-Control": "no-store,no-cache,must-revalidate,proxy-revalidate", // 不要缓存
          Pragma: "no-cache", // 兼容旧式缓存控制
          Expires: "0", // 立刻过期
        },
      }
    );
  } catch (error) {
    console.error("Sign out error", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
