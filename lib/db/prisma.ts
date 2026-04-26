import { PrismaClient } from "@prisma/client";
// 导入PrismaClient 是数据库操作对象 要先new PrismaClient() 然后在导出
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
}; // 创建一个全局对象 在开发环境里面复用

export const prisma =
  globalForPrisma.prisma ?? // 有旧的就复用
  new PrismaClient({
    // 创建一个数据库客户端实例
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// 如果现在不是生产环境 那就把刚才这个prisma保存到全局对象上 以后热更新在进来时就能直接复用

export default prisma;
/**
 * 怎么连接数据库
 */
