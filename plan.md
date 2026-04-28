# BookWise 优化计划细化版

> 目标：把 BookWise 从“功能可用”的学习项目，升级成更接近生产级的作品集项目。执行顺序按“先稳定基础、再重构复用、再性能优化、最后亮点功能”推进。

---

## 项目真实现状

- **技术栈**：Next.js 16 + React 19 + TypeScript + Prisma + MySQL + NextAuth v5 + Tailwind CSS
- **已确认问题**：
  - 用户端多个页面重复手写 Navbar。
  - `books`、`favorites`、`book detail` 等页面重复 `fetchUser`。
  - `app/api/books/route.ts` 存在评分和收藏状态 N+1 查询。
  - `app/api/user/favorites/route.ts` 也存在评分 N+1 查询。
  - `app/(user)/books/page.tsx` 和 `favorites/page.tsx` 存在 `randerStars` 拼写错误。
  - 多处 `user: any`、`keyTakeaways: any`、`chapters.map((chapter: any))`。
  - `app/layout.tsx` 仍是 `Create Next App` 默认 metadata。
  - 项目同时存在 `lib/prisma.ts` 和 `lib/db/prisma.ts` 两个 Prisma client 出口。
  - `dashboard` 页面请求了不存在的 `/api/subscription/orders`，真实接口是 `/api/subscription-orders`。
  - `/api/user/categories` 当前未返回 `icon`，但前端会读取 `category.icon`。

### 代码审查补充发现

以下问题来自 `changemore.md` 的第二轮代码审查，执行对应步骤时需要顺手修复：

1. `app/(user)/books/[id]/page.tsx` 当前把 `params` 标成 `Promise<{ id: string }>` 并用 `params.then` 解析；详情页拆成 Server/Client 后应由 server page 直接接收 resolved `params`。
2. `app/(user)/favorites/page.tsx` 的 `Favorite` 类型里写了 `createAt`，应统一为 Prisma/API 实际字段 `createdAt`。
3. `app/(user)/dashboard/page.tsx` 在 render 阶段直接 `router.push("/login")`，容易出现一帧闪烁；改造时应放到 `useEffect` 或通过 `useUser` 的 loading/redirect 状态处理。
4. `app/api/books/[id]/route.ts` 返回的 `userSubscriptionTier` 是用户态字段，不是纯 book 资源字段；Step 8 音频权限迁移时应优先从 `useUser`/session 获取订阅状态，避免前端过度依赖 book payload 里的用户信息。

---

## Step 0：执行前基线与项目入口统一

**目标**：先确认项目当前状态，统一关键入口，避免后续重构产生混乱。

### 具体步骤

1. 运行 `npm run lint`，记录当前已有 lint/type 问题。
2. 运行 `npm run build`，记录当前 production build 是否通过。
3. 检查 `package.json`，确认 `zod` 已安装，后续只新增 `zustand @tanstack/react-query @tanstack/react-query-devtools`。
4. 统一 Prisma 入口，保留 `lib/db/prisma.ts` 的带日志版本。
5. 把 `lib/prisma.ts` 改成 re-export：

```ts
export { prisma } from "./db/prisma";
export { default } from "./db/prisma";
```

6. 全项目搜索 `@/lib/prisma` 和 `@/lib/db/prisma`，确认后续新增代码只从 `@/lib/db/prisma` 导入。
7. 修复 `app/(user)/dashboard/page.tsx` 中错误接口路径：

```ts
// before
fetch("/api/subscription/orders");

// after
fetch("/api/subscription-orders");
```

8. 修改 `app/api/user/categories/route.ts`，select 增加 `icon: true`。
9. 新建 `types/api.ts`，先放 Step 1 会用到的基础 DTO 类型，不放 Zod schema。
10. 基础 DTO 至少包含：

- `UserProfile`
- `CategoryDTO`
- `BookListItem`
- `BookDetailDTO`
- `BookChapterDTO`
- `BookReviewDTO`
- `FavoriteItem`

11. 确认 `tsconfig.json` 已开启 `strict: true`，后续类型修复以 strict 模式为准。
12. 记录基线命令结果时要注明：如果当前 `lint/build` 因历史 `any`、client/server 边界或现有 bug 失败，这只是基线，不阻塞 Step 1 开始执行。

### 验收标准

- [ ] `lib/prisma.ts` 不再创建新的 PrismaClient。
- [ ] 后续代码统一使用同一个 Prisma client。
- [ ] dashboard 订阅订单请求能命中真实 API。
- [ ] categories API 返回 `id/name/slug/icon`。
- [ ] `types/api.ts` 已创建，Step 1 组件不需要临时写 `any`。
- [ ] 已确认 `tsconfig.json` 的 strict 状态。

---

## Step 1：组件化重构与重复 UI 清理

**目标**：消除用户端重复 UI，让页面结构更像真实项目。

### 新建文件

| 文件                                | 说明               |
| ----------------------------------- | ------------------ |
| `components/layout/Navbar.tsx`      | 统一用户端导航栏   |
| `components/layout/UserLayout.tsx`  | 用户端统一页面外壳 |
| `components/ui/StarRating.tsx`      | 统一星级评分组件   |
| `components/ui/BookCard.tsx`        | 统一图书卡片       |
| `components/ui/LoadingSkeleton.tsx` | 骨架屏组件         |
| `components/ui/EmptyState.tsx`      | 空状态组件         |

### Navbar 具体要求

1. `Navbar.tsx` 使用 `"use client"`。
2. props 固定为：

```ts
type NavbarProps = {
  user?: UserProfile | null;
  activePath?: string;
  onSignOut?: () => void;
};
```

3. 左侧统一 BookWise logo，使用 emerald/teal 风格。
4. 中间固定用户端导航：
   - `/dashboard`
   - `/books`
   - `/favorites`
   - `/pricing`
5. 根据 `activePath` 给当前页面 emerald 高亮。
6. 右侧登录态显示：
   - `user.fullName`
   - `user.subscriptionTier`
   - `ThemeToggle`
   - `Sign Out`
7. 如果 `user.role === "ADMIN"`，显示 `/admin/dashboard` 入口。
8. 未登录时显示 `ThemeToggle` 和 `/login` 登录按钮。
9. Step 1 过渡阶段允许 `user` 和 `onSignOut` 由页面传入，避免在状态管理完成前阻塞组件化。
10. Step 2 完成 `useUser` 后，再把 Navbar 改为内部消费 `useUser()`，彻底删除页面级重复 `fetchUser` 和 `handleSignOut`。

### UserLayout 具体要求

1. 统一外层样式：

```tsx
<div className="min-h-screen bg-slate-50 dark:bg-slate-950">
  <Navbar ... />
  <main>{children}</main>
</div>
```

2. 支持可选 `contentClassName`，用于页面控制最大宽度和 padding。

### StarRating 具体要求

1. props 固定为：

```ts
type StarRatingProps = {
  value: number;
  interactive?: boolean;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (value: number) => void;
};
```

2. `interactive=false` 时使用非按钮元素或 disabled button。
3. `interactive=true` 时点击第 N 颗星触发 `onChange(N)`。
4. `showValue=true` 时显示 `(4.5)` 这类分数。
5. 替换所有 `randerStars` 和 `renderStars`。

### BookCard 具体要求

1. props 固定为：

```ts
type BookCardProps = {
  book: BookListItem;
  user?: UserProfile | null;
  variant?: "grid" | "favorite";
  onToggleFavorite?: (bookId: number, isFavorited: boolean) => void;
};
```

2. 统一处理：
   - 封面图。
   - 无封面占位。
   - 分类 badge。
   - 标题跳转 `/books/:id`。
   - 作者。
   - 两行描述。
   - 评分。
   - review 数量。
   - 收藏按钮。
3. 收藏按钮点击必须 `e.preventDefault()`，避免触发卡片跳转。
4. 免费用户显示升级提示链接 `/pricing`。

### 页面改造顺序

1. 改造 `app/(user)/books/page.tsx`：
   - 删除内联 Navbar。
   - 删除内联图书卡片。
   - 删除 `randerStars`。
   - 图书网格使用 `BookCard`。
2. 改造 `app/(user)/favorites/page.tsx`：
   - 删除内联 Navbar。
   - 删除内联 favorite card。
   - 空状态使用 `EmptyState`。
3. 改造 `app/(user)/books/[id]/page.tsx`：
   - 删除内联 Navbar。
   - 评分展示和评论表单评分都使用 `StarRating`。
4. 改造 `app/(user)/dashboard/page.tsx`：
   - 只替换 Navbar，不改业务布局。
5. 改造 `app/(user)/pricing/page.tsx`：
   - 只替换 Navbar，不改业务布局。

### 验收标准

- [ ] 用户端页面不再重复手写 Navbar。
- [ ] 项目中不存在 `randerStars`。
- [ ] books 和 favorites 复用同一个 `BookCard`。
- [ ] loading 状态不再只显示纯文字。

---

## Step 2：TanStack Query、Zustand 与请求 Hook

**目标**：区分服务端状态和客户端 UI 状态，消除重复 fetch。

### 安装依赖

```bash
npm install zustand @tanstack/react-query @tanstack/react-query-devtools
```

### 新建文件

| 文件                                     | 说明                 |
| ---------------------------------------- | -------------------- |
| `lib/query-client.ts`                    | QueryClient 默认配置 |
| `components/providers/QueryProvider.tsx` | React Query Provider |
| `lib/store/useUserStore.ts`              | 用户基础信息 store   |
| `lib/store/useAudioStore.ts`             | 全局音频状态 store   |
| `hooks/useUser.ts`                       | 用户资料查询         |
| `hooks/useCategories.ts`                 | 分类查询             |
| `hooks/useBooks.ts`                      | 图书列表查询         |
| `hooks/useBook.ts`                       | 单本图书查询         |
| `hooks/useFavorites.ts`                  | 收藏查询和 mutation  |

### QueryClient 配置

`lib/query-client.ts`：

```ts
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
};
```

### Provider 顺序

修改 `app/layout.tsx`：

```tsx
<ThemeProvider>
  <SessionProvider>
    <QueryProvider>
      <ToastProvider />
      {children}
    </QueryProvider>
  </SessionProvider>
</ThemeProvider>
```

### useUser 具体行为

1. queryKey 使用 `["user"]`。
2. 请求 `/api/user/profile`。
3. 401 时返回 `null`，不要抛出错误。
4. 成功时同步写入 `useUserStore`。
5. 暴露：

```ts
{
  (user, isLoading, isAuthenticated, signOutUser);
}
```

6. `signOutUser` 统一：
   - POST `/api/auth/signout`
   - 清空 user store。
   - 通过 `useQueryClient()` 调用 `queryClient.clear()` 或至少清理 `["user"]`、`["books"]`、`["favorites"]`、`["book"]` 相关缓存。
   - 跳转 `/`。
7. `useFavorites` 遇到 401 时要保留当前页面行为：跳转 `/login` 或向调用方返回未登录状态，由页面统一跳转。

### useBooks 具体行为

1. 入参：

```ts
type UseBooksParams = {
  search?: string;
  category?: string;
  page: number;
  limit: number;
};
```

2. queryKey：

```ts
["books", { search, category, page, limit }];
```

3. 请求 `/api/books?page=...&limit=...&search=...&category=...`。
4. 返回 `{ books, pagination }`。

### useFavorites 具体行为

1. `useFavorites` 查询 `["favorites"]`。
2. `useToggleFavorite` 负责收藏和取消收藏。
3. 先实现普通 mutation，Step 4 再加乐观更新。

### 页面改造

1. `books/page.tsx` 删除：
   - `fetchUser`
   - `fetchCategories`
   - `fetchBooks`
   - 对应 `useEffect`
2. 改用：
   - `useUser`
   - `useCategories`
   - `useBooks`
3. `favorites/page.tsx` 删除：
   - `fetchUser`
   - `fetchFavorites`
4. 改用：
   - `useUser`
   - `useFavorites`
5. `books/[id]/page.tsx` 删除：
   - `fetchUser`
   - `fetchBook`
6. 改用：
   - `useUser`
   - `useBook`

### 验收标准

- [ ] 用户资料请求由 `useUser` 统一管理。
- [ ] 返回 books 页面时优先使用缓存。
- [ ] 页面组件不再直接写大量 fetch/useEffect。
- [ ] React Query Devtools 仅在 development 显示。

---

## Step 3：API N+1 查询与数据查询层

**目标**：把列表接口从“每本书额外查询”优化为固定次数查询。

### 新建文件

`lib/db/queries.ts`

### getPublishedBooksWithMeta

函数签名：

```ts
type GetPublishedBooksWithMetaInput = {
  userId?: string;
  search?: string;
  categoryId?: number;
  page: number;
  limit: number;
};
```

实现步骤：

1. 构造 `Prisma.BookWhereInput`，固定包含：

```ts
{
  isPublished: true;
}
```

2. 如果有 search，添加 OR：

```ts
OR: [
  { title: { contains: search } },
  { author: { contains: search } },
  { description: { contains: search } },
];
```

3. MySQL 下不要使用当前代码里的 `mode: "insensitive"`。
4. 如果有 categoryId，添加 `categoryId`。
5. 用 `Promise.all` 并行：
   - `prisma.book.findMany`
   - `prisma.book.count`
6. 从当前页 books 提取 `bookIds`。
7. 如果 `bookIds.length === 0`，直接返回空列表。
8. 用一次 `bookReview.groupBy` 查询当前页所有书平均分：

```ts
prisma.bookReview.groupBy({
  by: ["bookId"],
  where: {
    bookId: { in: bookIds },
    isApproved: true,
  },
  _avg: { rating: true },
});
```

9. 登录用户用一次 `userFavorite.findMany` 查询收藏：

```ts
prisma.userFavorite.findMany({
  where: {
    userId,
    bookId: { in: bookIds },
  },
  select: { bookId: true },
});
```

10. 用 `Map<number, number>` 合并平均分。
11. 用 `Set<number>` 合并收藏状态。
12. 返回结构保持兼容：

```ts
{
  books,
  pagination: {
    page,
    limit,
    totalCount,
    totalPages,
  }
}
```

### 修改 app/api/books/route.ts

1. route 只负责：
   - 读取 session。
   - 解析 query。
   - 调用 `getPublishedBooksWithMeta`。
   - 返回 JSON。
2. 删除 `books.map(async book => ...)` 内部 aggregate/findFirst。
3. catch 必须返回 500 JSON。

### getUserFavoritesWithMeta

1. 新建函数 `getUserFavoritesWithMeta(userId: string)`。
2. 查询 favorites 时 include book/category/count。
3. 提取所有 `bookIds`。
4. 用一次 `bookReview.groupBy` 查询评分。
5. 合并平均分到 favorite.book。

### 修改 app/api/user/favorites/route.ts

1. GET 改为调用 `getUserFavoritesWithMeta`。
2. 删除 favorites.map 内部 aggregate。
3. POST 保留业务逻辑，但 schema 移到 Step 6 的 validations 文件。
4. catch 必须返回 500 JSON。

### 其他 API 修复

1. `app/api/books/[id]/route.ts` catch 增加 500 返回。
2. `app/api/user/favorites/[id]/route.ts`：
   - `parseInt(id)` 后检查 `Number.isNaN(bookId)`。
   - 非法 id 返回 400。
   - catch 返回 500。
3. `app/api/user/review/route.ts` catch 返回 500。

### 验收标准

- [ ] books 列表接口不再按每本书查询评分和收藏。
- [ ] favorites 列表接口不再按每本书查询评分。
- [ ] 所有用户端 API catch 都返回 JSON。
- [ ] MySQL 查询不再使用无效的 `mode: "insensitive"`。

---

## Step 4：收藏乐观更新

**目标**：收藏操作点击后立即反馈，失败时自动回滚。

### 修改位置

`hooks/useFavorites.ts`

### useToggleFavorite 具体要求

1. mutation 入参：

```ts
type ToggleFavoriteInput = {
  bookId: number;
  isFavorited: boolean;
};
```

2. `isFavorited === true` 时：

```ts
DELETE /api/user/favorites/:bookId
```

3. `isFavorited === false` 时：

```ts
POST / api / user / favorites;
body: {
  bookId;
}
```

4. `onMutate` 先取消相关 query：
   - `["favorites"]`
   - 所有 `["books"]` 前缀 query
   - `["book", bookId]`
5. 保存 previous snapshots：
   - favorites snapshot
   - books list snapshots
   - book detail snapshot
6. 乐观更新 `["book", bookId]` 的 `isFavorited`。
7. 乐观更新所有 books 列表缓存中对应 book 的 `isFavorited`。
8. 如果是取消收藏，乐观删除 favorites 缓存中的对应项。
9. 如果是新增收藏，不强行构造完整 FavoriteItem，等 settled 后重新拉取 favorites。
10. `onError`：

- 恢复 snapshots。
- `toast.error("Failed to update favorites")`。

11. `onSuccess`：

- 新增时提示 `Added to favorites`。
- 删除时提示 `Removed from favorites`。

12. `onSettled`：

- invalidate `["favorites"]`
- invalidate `["books"]`
- invalidate `["book", bookId]`

### 降低风险的实现顺序

1. 先实现只更新当前详情页或当前 books 列表缓存的简单乐观更新。
2. 再扩展到 `queryClient.getQueriesData({ queryKey: ["books"] })`，批量更新所有 books 查询缓存。
3. 最后再补 favorites 列表删除项的乐观更新。
4. 每一步都要保留 `onError` 回滚，避免一次性改 3 类 query cache 难以调试。

### 页面接入

1. `BookCard` 点击心形时调用 `onToggleFavorite(book.id, book.isFavorited)`。
2. 未登录时：
   - 不调用 mutation。
   - toast 提示登录。
   - 跳转 `/login`。
3. `favorites` 页面删除 confirm 弹窗，或者保留 confirm 但 confirm 后仍走统一 mutation。

### 验收标准

- [ ] 点击心形后 UI 立即变化。
- [ ] 网络失败时 UI 回滚。
- [ ] books、favorites、detail 三处收藏状态一致。

---

## Step 5：搜索防抖与 URL 状态同步

**目标**：减少无效请求，修复 state 异步导致 URL 读旧值的问题。

### 新建文件

| 文件                      | 说明                |
| ------------------------- | ------------------- |
| `hooks/useDebounce.ts`    | 通用防抖 hook       |
| `hooks/useBookFilters.ts` | 图书筛选和 URL 同步 |

### useDebounce

函数签名：

```ts
function useDebounce<T>(value: T, delay = 300): T;
```

实现要求：

1. 内部用 `setTimeout`。
2. value 或 delay 变化时清理旧 timer。
3. 默认延迟 300ms。

### useBookFilters

需要管理：

```ts
{
  (searchInput,
    setSearchInput,
    debouncedSearch,
    category,
    setCategory,
    page,
    setPage,
    queryFilters);
}
```

### URL 初始化

1. 从 `useSearchParams` 读取：
   - `search`
   - `category`
   - `page`
2. `page` 非数字或小于 1 时归一为 1。
3. `category` 非数字时归一为空字符串。
4. `search` 默认空字符串。

### URL 同步规则

1. 搜索输入绑定 `searchInput`。
2. `debouncedSearch` 变化后：
   - page 重置为 1。
   - `router.replace` 更新 URL。
3. 分类变化后：
   - page 重置为 1。
   - `router.replace` 更新 URL。
4. 分页变化后：
   - 只更新 page。
   - 不改变 search/category。
5. URL 只写非默认值：
   - search 非空才写。
   - category 非空才写。
   - page 大于 1 才写。
6. 使用 `router.replace`，避免每次输入都增加浏览器历史。

### 页面接入

1. `books/page.tsx` 删除当前 `handleSearch` 中的 `updateURL()` 旧逻辑。
2. 搜索 form submit 时只阻止默认行为，不直接手动 fetch。
3. `useBooks` 的参数来自 `queryFilters`。
4. `useBookFilters` 内部使用 `useSearchParams`，调用它的组件必须继续位于 `Suspense` 边界内；当前 books 页面已有 Suspense，重构后不能移除。

### 验收标准

- [ ] 连续输入只在停止 300ms 后请求。
- [ ] `/books?search=react&page=2&category=1` 刷新后状态正确恢复。
- [ ] 搜索时 page 不会读到旧值。
- [ ] 使用 `useSearchParams` 的 books client 组件仍被 Suspense 包裹。

---

## Step 6：完善类型安全与 Zod 校验

**目标**：减少 `any`，让 API 输入输出更可控。

### 新建或完善文件

| 文件                          | 说明                                        |
| ----------------------------- | ------------------------------------------- |
| `types/api.ts`                | Step 0 已创建，本步骤补齐字段并修正响应类型 |
| `lib/validations/book.ts`     | books query schema                          |
| `lib/validations/favorite.ts` | favorite body schema                        |
| `lib/validations/review.ts`   | review body schema                          |
| `lib/validations/user.ts`     | user profile schema 或类型辅助              |

### types/api.ts

该文件已在 Step 0 创建，Step 6 只负责补齐缺失 DTO、修正不合理字段，并替换残余 `any`。

定义：

```ts
export type ApiError = {
  error: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};
```

注意：分页响应中的 `data` 不应是 optional。空分页返回 `[]`，不要返回 `undefined`。

同时定义：

- `UserProfile`
- `CategoryDTO`
- `BookListItem`
- `BookDetailDTO`
- `BookChapterDTO`
- `BookReviewDTO`
- `FavoriteItem`

### book validation

`bookListQuerySchema` 规则：

1. `page` 默认 1，最小 1。
2. `limit` 默认 12，最小 1，最大 50。
3. `category`：
   - 空字符串转为 undefined。
   - 非空时必须是正整数。
4. `search`：
   - trim。
   - 最大 100 字符。
   - 空字符串转为 undefined。

### favorite validation

```ts
z.object({
  bookId: z.number().int().positive(),
});
```

### review validation

```ts
z.object({
  bookId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
});
```

### 替换 any

1. `books/page.tsx`：
   - `user: any` 替换为 `UserProfile | null`。
2. `favorites/page.tsx`：
   - `user: any` 替换为 `UserProfile | null`。
3. `books/[id]/page.tsx`：
   - `user: any` 替换为 `UserProfile | null`。
   - `keyTakeaways: any` 替换为 `unknown` 或明确数组类型。
   - `tableOfContents: any` 替换为 `unknown` 或明确数组类型。
   - `chapters.map((chapter: any))` 替换为 `BookChapterDTO`。
4. `app/api/books/route.ts`：
   - `const where: any` 替换为 `Prisma.BookWhereInput`。

### 验收标准

- [ ] 用户端核心页面不再有 `user: any`。
- [ ] books API 非法 query 返回 400。
- [ ] favorite/review schema 从 validations 文件导入。
- [ ] TypeScript strict 模式通过。
- [ ] `PaginatedResponse<T>` 使用 `data: T[]`，空列表用 `[]` 表达。

---

## Step 7：SEO 与 Metadata

**目标**：移除默认 metadata，让页面标题和分享信息更专业。

### app/layout.tsx

修改 metadata：

```ts
export const metadata: Metadata = {
  title: {
    default: "BookWise",
    template: "%s | BookWise",
  },
  description: "Professional book summaries, audio insights, and reading tools.",
  openGraph: {
    title: "BookWise",
    description: "Professional book summaries, audio insights, and reading tools.",
    siteName: "BookWise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookWise",
    description: "Professional book summaries, audio insights, and reading tools.",
  },
};
```

### Client Page 处理原则

Next.js 不允许在 `"use client"` page 中直接导出 metadata。需要：

1. 保留 server `page.tsx`。
2. 把原 client 内容移动到 `BooksClientPage.tsx` 或类似文件。
3. server page 负责 metadata。
4. client component 负责交互。

### `/books/[id]` 拆分策略

当前 `app/(user)/books/[id]/page.tsx` 是大型 Client Component，并包含 audio、review、favorite 等大量交互逻辑。动态 metadata 不能直接塞进这个文件，必须分阶段拆分：

1. 第一阶段只改 `app/layout.tsx` 和简单页面 metadata，确保全站不再显示 `Create Next App`。
2. 第二阶段把详情页拆成：
   - `app/(user)/books/[id]/page.tsx`：Server Component，负责接收 `params`、生成 metadata、渲染 client 组件。
   - `app/(user)/books/[id]/BookDetailClient.tsx`：Client Component，负责音频、收藏、评论等交互。
3. `generateMetadata` 需要书名和封面时，在 server page 中直接用 Prisma 查询最小字段，不复用 client hook。
4. 如果时间不足，详情页可以先使用静态 `Book Details` 标题，动态书名 metadata 延后到详情页拆分完成后再做。

### 页面 metadata

1. `/books`：
   - 无搜索：`Browse Books`
   - 有搜索：`Search "react"`
2. `/books/[id]`：
   - title 使用书名。
   - description 使用书籍 description 截断。
   - OG image 使用 `coverImageUrl`。
3. `/pricing`：
   - `Pricing`
4. `/favorites`：
   - `My Favorites`
5. `/dashboard`：
   - `Dashboard`

### 验收标准

- [ ] 浏览器标签页不再显示 `Create Next App`。
- [ ] 每个核心页面标题唯一。
- [ ] 图书详情页至少有独立标题；动态书名和封面分享在 Server/Client 拆分完成后验收。

---

## Step 8：音频播放器增强与进度持久化

**目标**：把现有详情页内联 audio 逻辑升级成全局播放器，并支持多端续播。

### Prisma 修改

`UserReadingHistory` 当前已经有 `audioPosition` 和 `completionPercentage`，本步骤只需要增加章节索引字段：

```prisma
chapterIndex Int @default(0) @map("chapter_index")
```

执行 migration：

```bash
npx prisma migrate dev --name add-reading-history-chapter-index
```

### 新建 API

| API                                  | 方法  | 说明                     |
| ------------------------------------ | ----- | ------------------------ |
| `/api/user/reading-history`          | GET   | 获取当前用户最近阅读记录 |
| `/api/user/reading-history/[bookId]` | GET   | 获取单本书进度           |
| `/api/user/reading-history/[bookId]` | PATCH | 保存单本书进度           |

PATCH body：

```ts
{
  chapterIndex: number;
  audioPosition: number;
  completionPercentage: number;
}
```

实现要求：

1. 未登录返回 401。
2. bookId 非法返回 400。
3. 保存使用 upsert。
4. unique key 使用 schema 里已有的 `userId_bookId`。

### 新建文件

| 文件                                     | 说明               |
| ---------------------------------------- | ------------------ |
| `components/audio/GlobalAudioPlayer.tsx` | 全局底部播放器     |
| `hooks/useAudioPlayer.ts`                | audio 操作逻辑     |
| `hooks/useAudioPersistence.ts`           | 读取和保存播放进度 |

### GlobalAudioPlayer

1. 放在 `app/layout.tsx` 的 provider 内全局渲染。
2. 底部 fixed。
3. 最小态显示：
   - 书名。
   - 当前章节。
   - 播放/暂停。
   - 进度条。
4. 展开态显示：
   - 上一章/下一章。
   - 倍速选择。
   - 当前时间/总时长。
   - 收起按钮。
5. 没有当前音频时不显示。

### useAudioPlayer

负责：

1. audio ref。
2. play。
3. pause。
4. seek。
5. nextChapter。
6. previousChapter。
7. playbackRate。
8. currentTime/duration 同步。

### useAudioPersistence

1. 进入详情页时 GET 历史记录。
2. 如果有历史记录，恢复 `chapterIndex` 和 `audioPosition`。
3. 播放中每 10 秒保存一次。
4. 暂停时保存一次。
5. 切换章节时保存一次。
6. 页面卸载前尽量保存一次。

### 免费用户限制

1. 保留当前免费用户 10 秒试听逻辑。
2. 超过 10 秒时暂停。
3. toast 提示升级。
4. 引导 `/pricing`。

### 键盘快捷键

1. Space：播放/暂停。
2. ArrowLeft：后退 10 秒。
3. ArrowRight：前进 10 秒。
4. input、textarea、select 聚焦时不触发。

### 验收标准

- [ ] 刷新页面后能恢复到上次章节和秒数。
- [ ] 切换页面后底部播放器仍存在。
- [ ] 免费用户仍只能试听 10 秒。
- [ ] 倍速播放可用。

---

## Step 9：用户端分页体验优化

**目标**：保留 `/books?page=&search=&category=` 的 URL 语义，优化分页体验，而不是把用户端图书浏览强行改成无限滚动或虚拟列表。

### 设计原则

1. 用户端 books 页面继续使用分页。
2. 保留 URL 中的 `page` 参数，支持刷新、分享和浏览器前进后退。
3. 搜索和分类状态继续由 `useBookFilters` 管理。
4. 返回上一页时通过 TanStack Query 命中缓存。
5. 用户端不引入 `@tanstack/react-virtual`，因为单页渲染数量由 `limit` 控制，虚拟列表收益不明显。

### 分页控件优化

1. 不再渲染所有页码，避免总页数很多时撑爆页面。
2. 固定显示：
   - `Previous`
   - 第一页
   - 当前页前后 1-2 页
   - 最后一页
   - `Next`
3. 页码中间断层显示省略号。
4. `currentPage === 1` 时禁用 `Previous`。
5. `currentPage === totalPages` 时禁用 `Next`。
6. totalPages 小于等于 7 时可以显示全部页码。

### 页面改造

1. 保留 `/api/books?page=&limit=&search=&category=` API。
2. 保留 `useBooks({ search, category, page, limit })`。
3. 搜索或分类变化时 page 重置为 1。
4. loading 使用 `BookGridSkeleton`。
5. 空结果使用 `EmptyState`。
6. 分页区域抽成 `components/ui/Pagination.tsx`，便于复用和测试。

### 验收标准

- [ ] `/books?search=react&category=1&page=2` 刷新后状态正确恢复。
- [ ] 页数很多时分页控件不会撑爆页面。
- [ ] 搜索和分类切换后 page 自动回到 1。
- [ ] Previous/Next 禁用状态正确。
- [ ] 返回上一页优先命中 TanStack Query 缓存。
- [ ] 用户端 books 页面不使用虚拟列表。

---

## Step 10：Admin 管理列表虚拟化

**目标**：把虚拟列表能力放在后台高密度管理页，减少大量表格/卡片一次性渲染造成的 DOM 压力，体现前端性能优化能力。

### 安装依赖

```bash
npm install @tanstack/react-virtual
```

### 适用范围

需要接入虚拟列表的页面：

- `app/(admin-dashboard)/admin/books/page.tsx`
- `app/(admin-dashboard)/admin/users/page.tsx`
- `app/(admin-dashboard)/admin/reviews/page.tsx`

不需要接入虚拟列表的页面：

- `app/(admin-dashboard)/admin/dashboard/page.tsx`
- 原因：dashboard 首页只展示统计卡片和 recent users/books 各 5 条，没有虚拟化收益。

### 新建文件

| 文件                                     | 说明                                    |
| ---------------------------------------- | --------------------------------------- |
| `components/admin/VirtualAdminTable.tsx` | 后台虚拟表格容器                        |
| `components/admin/VirtualAdminList.tsx`  | 后台虚拟卡片列表容器                    |
| `hooks/useAdminVirtualizer.ts`           | 封装 `@tanstack/react-virtual` 通用配置 |

### /admin/books 虚拟表格

1. 当前 `admin/books/page.tsx` 是 Server Component，先拆成：
   - server page：鉴权、读取 books、统计数据。
   - client component：渲染虚拟表格。
2. 保留当前统计卡片。
3. 表头固定在虚拟滚动容器顶部。
4. body 行使用 virtualizer 渲染。
5. 每行高度固定为 88px 左右。
6. 保留列：
   - Book
   - Category
   - Status
   - Audio
   - Reviews
   - Created
   - Actions
7. 保留操作：
   - View
   - Edit
   - Delete
8. 封面图片区域固定尺寸，避免行高抖动。

### /admin/users 虚拟表格

1. 当前页面已经是 Client Component，可以直接接入 virtualizer。
2. 删除当前用于调试的 `window.fetch` monkey patch 逻辑。
3. 保留现有 filter：
   - all
   - premium
   - free
   - admin
4. filter 后的数据再传给 virtualizer。
5. filter 切换后虚拟列表滚动位置回到顶部。
6. 每行高度固定为 72px 左右。
7. 保留 View Details 操作。

### /admin/reviews 虚拟卡片列表

1. 当前 reviews 是卡片列表，不适合强行表格化。
2. 使用 `VirtualAdminList` 做纵向虚拟卡片。
3. review 文本默认 `line-clamp`，避免长评论导致高度严重不稳定。
4. 每项估算高度为 220px 左右。
5. 如果后续保留完整长文本展示，优先使用 `measureElement` 做动态高度测量，不要只依赖固定估算高度。
6. 保留现有 filter：
   - all
   - approved
   - pending
   - verified
7. 保留操作：
   - Approve / Unapprove
   - Delete
8. filter 切换后滚动位置回到顶部。

### 实现约束

1. 第一阶段可以保留当前 admin API 一次性取全量数据，先优化前端 DOM 渲染。
2. 虚拟列表只负责渲染层，不改变现有 admin 操作逻辑。
3. 虚拟列表只能解决渲染性能，不解决全量数据传输慢的问题。
4. 如果后续数据继续增大，再追加 admin API 分页和服务端搜索。
5. 表格列宽保持稳定，避免虚拟行滚动时布局抖动。
6. 虚拟滚动容器需要明确高度，例如 `h-[640px]` 或基于 viewport 的 `calc(...)`。

### 验收标准

- [ ] `/admin/books` 渲染 500+ books 时 DOM 中实际行数远小于总数。
- [ ] `/admin/users` filter 切换后虚拟列表回到顶部。
- [ ] `/admin/reviews` 长评论不会导致滚动高度严重抖动。
- [ ] View/Edit/Delete/Approve 等操作保持可用。
- [ ] admin dashboard 首页不引入虚拟列表。

---

## Step 11：性能、错误边界与体验收尾

**目标**：补齐生产级项目常见基础设施。

### 图片优化

1. 检查项目中的 `<img>`。
2. 用户端图片统一使用 `next/image`。
3. 根据真实封面 URL 来源修改 `next.config.ts`：

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
};
```

4. 首屏关键图片按需设置 `priority`。
5. 列表页普通卡片不要滥用 `priority`。

### 错误和加载边界

新建：

| 文件                   | 说明         |
| ---------------------- | ------------ |
| `app/loading.tsx`      | 全局 loading |
| `app/error.tsx`        | 路由级错误页 |
| `app/global-error.tsx` | 根级错误页   |

`app/error.tsx` 要求：

1. 使用 `"use client"`。
2. 接收 `error` 和 `reset`。
3. 显示友好错误信息。
4. 提供 `Try again` 按钮调用 `reset()`。

`app/global-error.tsx` 要求：

1. 包含 `<html>` 和 `<body>`。
2. 显示根级 fallback。

### 大文件拆分

1. 拆分 `app/(user)/books/page.tsx`：
   - `BookFilters`
   - `BookGrid`
   - `BookResultsHeader`
2. 拆分 `app/(user)/books/[id]/page.tsx`：
   - `BookHero`
   - `AudioSummary`
   - `TableOfContents`
   - `ReviewSection`
3. 拆分时保持行为不变，先移动代码，再做逻辑优化。

### 最终检查

1. 运行 `npm run format:check`。
2. 如果格式不通过，运行 `npm run format`。
3. 运行 `npm run lint`。
4. 运行 `npm run build`。
5. 手动验证核心路径：
   - 注册。
   - 登录。
   - 退出。
   - dashboard。
   - books 搜索。
   - books 分类。
   - 收藏。
   - favorites。
   - book detail。
   - 评论。
   - 音频。
   - pricing。

### 验收标准

- [ ] production build 通过。
- [ ] 核心用户流可用。
- [ ] 页面有 loading、empty、error 状态。
- [ ] 代码文件复杂度下降。

---

## Optional：PWA 离线能力

**目标**：作为最后的锦上添花能力展示。只有 Step 0-11 都稳定，并且 `lint/build/manual` 验证通过后再执行。

### 实现原则

1. PWA 不进入核心交付路径。
2. 优先评估 Workbox 或成熟 PWA 方案，避免手写 Service Worker 缓存策略影响认证和 API。
3. 如果继续手写 `public/sw.js`，必须严格限制缓存范围。
4. 不缓存任何用户敏感接口或后台接口。

### 新建文件

| 文件                                             | 说明                                   |
| ------------------------------------------------ | -------------------------------------- |
| `public/manifest.json`                           | PWA manifest                           |
| `public/sw.js`                                   | Service Worker，仅在选择手写方案时创建 |
| `components/providers/ServiceWorkerProvider.tsx` | 注册 SW                                |
| `components/OfflineNotice.tsx`                   | 离线提示                               |

### 缓存策略

1. 可以缓存：
   - `/`
   - `/books`
   - 已访问过的公开图书详情页。
   - 基础静态资源。
2. 禁止缓存：
   - `/api/user/*`
   - `/api/admin/*`
   - `/api/auth/*`
   - favorites、profile、reading history 等用户敏感接口。
3. `/api/books` 和公开 `/api/books/:id` 如需缓存，使用 Network First + Cache Fallback。

### 验收标准

- [ ] 访问过的公开图书列表断网后能看到缓存内容。
- [ ] 访问过的公开图书详情断网后能看到缓存内容。
- [ ] 用户敏感 API 和 admin API 不被缓存。
- [ ] 离线时有明确提示。

---

## Public Interfaces And Types

### UserProfile

```ts
type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  subscriptionTier: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  audioListenTime: number;
  createdAt: string;
};
```

### BookListItem

```ts
type BookListItem = {
  id: number;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  category: CategoryDTO;
  averageRating: number;
  isFavorited: boolean;
  _count: {
    reviews: number;
    favorites: number;
  };
};
```

### FavoriteItem

```ts
type FavoriteItem = {
  id: number;
  bookId: number;
  createdAt: string;
  book: BookListItem;
};
```

### Reading History PATCH Body

```ts
type UpdateReadingHistoryBody = {
  chapterIndex: number;
  audioPosition: number;
  completionPercentage: number;
};
```

---

## Test Cases

### 用户状态

- [ ] 未登录访问 `/books`，可以浏览图书。
- [ ] 未登录点击收藏，toast 提示登录并跳转 `/login`。
- [ ] 已登录访问 `/dashboard`，展示用户资料和订阅信息。
- [ ] 点击退出后清空用户状态并跳转首页。

### 图书列表

- [ ] `/books` 默认加载第一页。
- [ ] `/books?search=react&page=2&category=1` 刷新后状态正确恢复。
- [ ] 快速输入搜索词，只在停止输入 300ms 后请求。
- [ ] 分类切换后 page 自动回到 1。
- [ ] 无结果时显示 EmptyState。

### 收藏

- [ ] books 页面点击心形立即变色。
- [ ] favorites 页面取消收藏后列表立即减少。
- [ ] detail 页面收藏状态和 books 页面一致。
- [ ] 网络失败时收藏状态回滚。

### API

- [ ] `/api/books?page=abc` 返回 400 或归一为 page 1。
- [ ] `/api/user/favorites` 未登录返回 401。
- [ ] `/api/user/favorites/:id` 非法 id 返回 400。
- [ ] 不存在的 book detail 返回 404。
- [ ] API catch 返回 500 JSON。

### 评论

- [ ] 评论少于 10 字返回错误。
- [ ] 评论超过 1000 字返回错误。
- [ ] 重复评论返回错误。
- [ ] 成功评论后提示等待管理员审核。

### 音频

- [ ] 免费用户播放超过 10 秒会暂停并提示升级。
- [ ] 付费用户可以完整播放。
- [ ] 播放中刷新页面后恢复章节和秒数。
- [ ] Space/ArrowLeft/ArrowRight 快捷键可用。
- [ ] 输入框聚焦时快捷键不触发。

### Admin 虚拟列表

- [ ] `/admin/books` 大量数据下实际 DOM 行数明显少于 books 总数。
- [ ] `/admin/users` filter 切换后虚拟列表回到顶部。
- [ ] `/admin/reviews` 长评论不会导致滚动高度明显抖动。
- [ ] admin 列表里的 View/Edit/Delete/Approve 操作保持可用。
- [ ] `/admin/dashboard` 首页不接入虚拟列表。

### Optional PWA

- [ ] 访问过 `/books` 后断网仍能看到缓存列表。
- [ ] 访问过图书详情后断网仍能看到缓存详情。
- [ ] `/api/user/profile` 不被 Service Worker 缓存。
- [ ] 离线时出现提示。

### 后续自动化测试建议

- [ ] 后续可补最小 API 测试，覆盖 books query validation、favorites 401、review validation。
- [ ] 后续可补 Playwright E2E，覆盖登录、books 搜索、收藏、详情页、admin 列表筛选。
- [ ] 本轮不强制引入测试框架，核心验收仍以 `format:check`、`lint`、`build` 和手动核心流为准。

### 最终质量

- [ ] `npm run format:check` 通过。
- [ ] `npm run lint` 通过。
- [ ] `npm run build` 通过。
- [ ] 核心用户路径手动验证通过。

---

## 推荐执行节奏

| 阶段     | 内容                                  | 预计耗时                         |
| -------- | ------------------------------------- | -------------------------------- |
| Day 1    | Step 0 + 基础 `types/api.ts` + Step 1 | 类型前置、组件化和基础清理       |
| Day 2    | Step 2                                | TanStack Query、Zustand 和 hooks |
| Day 3    | Step 3 + Step 5                       | API 性能和用户端搜索/URL         |
| Day 4    | Step 4                                | 乐观更新单独调试                 |
| Day 5    | Step 6                                | 类型安全和 Zod                   |
| Day 6    | Step 7 + Step 9                       | SEO 和用户端分页体验优化         |
| Day 7    | Step 11 前半                          | 错误边界、图片优化和大文件拆分   |
| Day 8    | Step 8                                | 音频播放器和进度持久化           |
| Day 9    | Step 10                               | Admin 管理列表虚拟化             |
| Day 10   | Step 11 后半                          | 最终检查、lint/build 和手动验证  |
| Optional | PWA 离线能力                          | 核心质量稳定后再做               |

---

## 优先级建议

如果时间有限，优先完成：

1. Step 0：基线和 Prisma 入口统一。
2. Step 1：组件化重构。
3. Step 2：TanStack Query 和 hooks。
4. Step 3：N+1 查询优化。
5. Step 5：搜索防抖和 URL 同步。
6. Step 6：类型安全。

这些最能体现工程能力、代码质量和性能意识。

Step 8 和 Step 10 属于亮点功能；Optional PWA 只有在核心质量稳定后再做。用户端 books 保留分页优化，虚拟列表放在 admin 管理列表里体现。

如果时间只有 7 天，建议把 Step 8 音频播放器和 Step 10 Admin 虚拟化作为加分项延后，先保证 Step 0-7、Step 9、Step 11 的核心质量闭环。
