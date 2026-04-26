/**
 * Authentication Middleware
 *
 * This middleware protects routes and handles authentication redirects.
 *
 * Protected routes:
 * - /dashboard - Requires authentication
 * - /admin - Requires ADMIN role
 * - /favorites - Requires authentication
 */
import { auth } from "@/lib/auth"; // 导入我们封装的 auth.js 模块 auth 是帮助我们检查登录状态的工具
import { NextResponse } from "next/server"; // Next.js提供的响应工具
/**
 * .redirect() 方法用于重定向用户到指定的 URL。
 * .next() 方法用于继续处理请求，允许用户访问当前请求的资源。
 */
// 请auth先帮我拿到当前的登录状态 然后我在更具请求决定要不要放行
export default auth((req) => {
  // req 是 NextRequest 对象，包含了请求的所有信息
  const { nextUrl } = req; // 从请求对象中获取 nextUrl 当前访问的网址信息
  const isLoggedIn = !!req.auth; // 判断用户是否已登录(req.auth 如果已经登录通常会有值 没登录通常就是空的 比如null 或者undefined 取反两次就变成了布尔值 true 或 false)
  const isAdmin = req.auth?.user?.role === "ADMIN"; // 判断用户是否具有 ADMIN 角色
  // 定义保护的路由
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/favorites"); // 需要登录的路由
  const isAdminRoute = nextUrl.pathname.startsWith("/admin"); // 需要管理员权限的路由(开头是)
  const isAdminLoginPage = nextUrl.pathname === "/admin/login"; // 管理员登录页
  const isAuthPage =
    nextUrl.pathname.startsWith("/login") || nextUrl.pathname === "/register"; // 登录页
  // 当访问受保护的路由但未登录时，重定向到登录页
  if (isProtectedRoute && !isLoggedIn) {
    // nextUrl.origin: http://localhost:3000 + "/login"
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname); // 登录成功后重定向回原来想要访问的页面
    return NextResponse.redirect(loginUrl); // 重定向到登录页
  }
  // Allow acess to admin login page
  if (isAdminLoginPage) {
    //如果已经作为管理员登录，直接重定向到管理员仪表盘
    if (isLoggedIn && isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl.origin));
    }
    return NextResponse.next(); // 允许访问管理员登录页(AdminLoginPage)
  }
  // 当访问管理员路由但未登录或没有管理员权限时，重定向到管理员登录页
  if (isAdminRoute && (!isLoggedIn || !isAdmin)) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl.origin));
  }
  // 保护 user dashboard
  if (isAuthPage && isLoggedIn) { // 如果访问登录页或注册页但已经登录了，重定向到用户仪表盘 不能重复登录
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }
  return NextResponse.next(); // 允许访问其他路由
});
