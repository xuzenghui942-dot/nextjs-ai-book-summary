# BookWise 项目开发规范与记忆

## 项目概览

- **框架**: Next.js 16 App Router (React 19)
- **语言**: TypeScript
- **数据库**: MySQL via Prisma ORM
- **认证**: NextAuth.js v5 (beta)
- **样式**: TailwindCSS v3 + dark mode (`class` strategy)
- **状态管理**: React Query (TanStack Query)
- **UI**: 完全自定义 Tailwind 组件，无第三方 UI 库
- **验证**: Zod
- **AI**: OpenAI SDK (摘要/音频生成)

## 关键文件位置

```
app/                     # Next.js App Router 页面
  (user)/                # 用户端页面
  (admin-dashboard)/     # 管理后台
  (auth)/                # 认证页面
  api/                   # API 路由
components/providers/    # Provider 组件 (Session, Theme, Query)
hooks/                   # 自定义 React hooks
lib/                     # 工具函数 (auth, prisma, query-client)
prisma/                  # 数据库 schema 和 seed
types/                   # TypeScript 类型定义
```

## 开发流程规则

### 必须遵守：Phase 完成后编写开发记录

**每完成一个 Phase，必须在 `pageoptimize.md` 中编写详细的开发记录。**

记录格式要求：
1. **日期和 Phase 编号**
2. **修改的文件清单**（每个文件列出路径和修改摘要）
3. **修改前后的关键代码对比**（以教程形式展示，让人能理解为什么这么改）
4. **验证结果**（如何验证优化生效，包含具体的测试步骤）
5. **性能指标对比**（修改前后的数据，如请求数量、响应时间等）
6. **注意事项**（部署或后续开发需要注意的问题）

示例格式：
```markdown
## Phase 1 开发记录 - 2026-04-26

### 修改文件清单
- `app/api/books/route.ts` — N+1查询修复，25次查询→3次
- `app/api/user/favorites/route.ts` — 评分批量查询优化
- ...

### 关键代码对比

#### /api/books — N+1 修复

**修改前**:
```typescript
// 25次查询：1次主查询 + 12×2次循环查询
const booksWithRatings = await Promise.all(
  books.map(async (book) => {
    const avgRating = await prisma.bookReview.aggregate({...});
    const favorite = await prisma.userFavorite.findFirst({...});
  })
);
```

**修改后**:
```typescript
// 3次并行查询
const [books, totalCount, bookIds] = await Promise.all([...]);
const ratings = await prisma.bookReview.groupBy({...});
const favorites = await prisma.userFavorite.findMany({...});
```

### 验证结果
1. 打开 Network 面板，请求 /api/books...
2. ...

### 性能指标对比
| 指标 | 修改前 | 修改后 |
|------|--------|--------|
| DB 查询数 | 25次 | 3次 |
| 响应时间 | ~800ms | ~150ms |
```

### 其他开发规范

1. **代码风格**: 遵循项目已有的 Tailwind 内联样式模式，不做样式重构
2. **组件提取**: 新建组件放在 `components/` 目录，hooks 放在 `hooks/` 目录
3. **API 路由**: 遵循已有的 `auth()` → 权限检查 → Prisma 查询 → JSON 响应模式
4. **暗色模式**: 所有新组件必须支持 `dark:` 变体
5. **Prisma 查询**: 优先使用 `include`/`select` 精确选择字段，避免 `*` 全量查询
6. **类型安全**: API 响应数据必须定义 TypeScript 接口，不使用 `any`

## 当前优化进度

- [x] Phase 1: N+1 查询修复 + 服务端分页 ✅
- [ ] Phase 2: React Query 状态管理
- [ ] Phase 3: 骨架屏 + 错误边界
- [ ] Phase 4: 渲染优化 (memo/callback/debounce/dynamic import)
- [ ] Phase 5: 虚拟列表
- [ ] Phase 6: next.config.ts + 全局优化