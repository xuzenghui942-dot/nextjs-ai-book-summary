# BookWise 项目记忆

## 验收文档约定

每完成一个 Step，必须将执行报告写入 `ACCEPTANCE.md` 验收文档中对应章节。用户需要对着该文档 review 每一步的完成情况。

验收文档格式：
- 每个 Step 独占一节
- 记录实际执行的变更、遇到的问题、与计划的偏差
- 列出该 Step 的验收标准 checklist，完成后打勾
- 附上当次 lint/build 结果截图或摘要

## 技术栈

Next.js 16 + React 19 + TypeScript + Prisma + MySQL + NextAuth v5 + Tailwind CSS

## 开发规范

- 新增依赖需经确认
- **Import 规范（必须）**：新代码统一使用 `"@/lib/db/prisma"` 导入 Prisma client，禁止新建独立 PrismaClient 实例
- 用户端页面统一使用 `UserLayout` + `Navbar`
- 状态管理使用 TanStack Query + Zustand
- API 返回统一 JSON，catch 必须返回 500
