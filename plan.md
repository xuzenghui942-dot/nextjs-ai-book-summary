# BookWise 浏览器性能优化计划

## 核心问题总结

| 严重度 | 问题 | 影响范围 |
|-------|------|---------|
| **P0** | N+1 查询：每本书2次额外查询，12本书=25次DB查询 | `/api/books`, `/api/user/favorites` |
| **P0** | 管理后台无分页：全量渲染所有书籍/用户/评论/订单 | admin/books, users, reviews, subscriptions |
| **P1** | 无数据缓存：每个页面独立 fetchUser，导航即重新请求 | 所有 client 页面 |
| **P1** | 无 loading/error UI：缺少 loading.tsx 和 error.tsx | 所有路由 |
| **P2** | 无 memoization：整个项目零 useMemo/useCallback/React.memo | 所有组件 |
| **P2** | 分类切换无防抖：selectedCategory 变化立即触发 fetch | `/books` |
| **P2** | 分页渲染所有页码：[...Array(totalPages)].map() | `/books` |
| **P3** | 无懒加载：重型组件未做 dynamic import | `/books/[id]` |
| **P3** | next.config.ts 为空：无图片优化、无 headers 配置 | 全局 |

---

## Phase 1：N+1 查询修复 + 服务端分页

### 1.1 `/api/books` 接口重构

**当前问题**：每页12本书触发 1+12×2=25 次 DB 查询

**优化方案**：批量查询取代循环查询

```
修改前：
  books.map(async (book) => {
    avgRating = await prisma.bookReview.aggregate(...)   // N次
    favorite = await prisma.userFavorite.findFirst(...)   // N次
  })

修改后：
  3次并行查询：
  1. prisma.book.findMany({ where, skip, take, include })  // 主查询
  2. prisma.bookReview.groupBy({ by: ['bookId'], _avg: { rating } })  // 批量评分
  3. prisma.userFavorite.findMany({ where: { userId, bookId: { in: ids } } })  // 批量收藏
  然后内存中合并数据
```

### 1.2 `/api/user/favorites` 接口重构

同样的 N+1 问题，使用 `groupBy` 批量查询评分。

### 1.3 管理后台服务端分页

| 页面 | 改造方式 | 新增API参数 |
|------|---------|------------|
| `admin/books` | 服务端组件添加 searchParams 分页 | `page`, `limit`, `search` |
| `admin/users` | API 增加 page/limit/role/search 参数 | `page`, `limit`, `role`, `search` |
| `admin/reviews` | API 增加 page/limit/status 参数 | `page`, `limit`, `status` |
| `admin/subscriptions` | API 增加 page/limit/status 参数 | `page`, `limit`, `status` |

### 1.4 智能分页组件

替换 `[...Array(totalPages)].map()` 为只显示：首页 ... 当前页±2 ... 末页

### 1.5 验证

- 确认 `/api/books` 响应时间大幅降低（从25次查询到3次）
- 确认管理后台表格正常分页
- 确认搜索/筛选参数与分页正确联动

---

## Phase 2：状态管理 — React Query（TanStack Query）

### 2.1 安装依赖

```
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2.2 文件结构

```
lib/
  query-client.ts          # QueryClient 实例 + 默认配置
hooks/
  use-user.ts              # 用户信息 hook（替代5页重复 fetchUser）
  use-books.ts             # 书籍列表 hook（分页+搜索+筛选）
  use-book-detail.ts       # 单本书详情 hook + 预取
  use-favorites.ts         # 收藏 hook（乐观更新）
  use-categories.ts        # 分类 hook（5分钟稳定缓存）
  use-debounce.ts          # 防抖 hook
components/providers/
  QueryProvider.tsx         # QueryClientProvider 全局 Provider
```

### 2.3 QueryClient 配置

```typescript
// lib/query-client.ts
defaultOptions: {
  queries: {
    staleTime: 60 * 1000,       // 1分钟内不重新请求
    gcTime: 5 * 60 * 1000,     // 5分钟垃圾回收
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
}
```

### 2.4 核心 Hooks

| Hook | 功能 | 替代内容 |
|------|------|---------|
| `useUser()` | 共享用户缓存 | 5个页面的 `fetchUser()` |
| `useBooks(params)` | 分页+搜索+筛选 | books 页面手动 fetch |
| `useBookDetail(id)` | 单书详情+预取 | book detail 页面手动 fetch |
| `useFavorites()` | 收藏列表 | favorites 页面手动 fetch |
| `useToggleFavorite()` | 乐观更新收藏切换 | `fetchBooks()` 全量重请求 |
| `useCategories()` | 稳定缓存分类 | books 页面手动 fetchCategories |
| `useDebounce(value, delay)` | 搜索防抖 | 直接触发 fetch |

### 2.5 乐观更新策略

收藏切换的 onMutate/onError/onSettled 流程：
1. `onMutate`: 取消进行中查询 → 保存旧快照 → 乐观更新 favorites 和 books 缓存
2. `onError`: 回滚 favorites 到旧快照 → invalidate books
3. `onSettled`: invalidate favorites 确保数据一致

### 2.6 页面改造清单

| 页面 | 当前代码行数（数据逻辑） | 改造后 |
|------|------|--------|
| `/books` | ~60行 useState+fetch | useUser + useBooks + useCategories + useToggleFavorite |
| `/books/[id]` | ~50行 | useUser + useBookDetail |
| `/favorites` | ~40行 | useUser + useFavorites + useToggleFavorite |
| `/dashboard` | ~30行 | useUser |
| `/pricing/checkout` | ~30行 | useUser |

### 2.7 预取能力

BookCard 组件添加 `onMouseEnter` 时调用 `queryClient.prefetchQuery` 预取书籍详情，点击进入详情页时数据已缓存。

### 2.8 验证

- 确认导航时用户信息不重复请求（Network 面板查看）
- 确认收藏切换秒级响应（乐观更新）
- 确认 React Query DevTools 正常显示查询状态
- 确认搜索防抖生效（300ms延迟）

---

## Phase 3：骨架屏 + 错误边界

### 3.1 需要添加 loading.tsx 的路由

```
app/(user)/books/loading.tsx
app/(user)/books/[id]/loading.tsx
app/(user)/dashboard/loading.tsx
app/(user)/favorites/loading.tsx
app/(admin-dashboard)/admin/books/loading.tsx
app/(admin-dashboard)/admin/users/loading.tsx
app/(admin-dashboard)/admin/reviews/loading.tsx
app/(admin-dashboard)/admin/subscriptions/loading.tsx
```

### 3.2 需要添加 error.tsx 的路由

同上所有路由添加 error.tsx，包含：
- 友好的错误图标和提示文案
- "Try Again" 重试按钮调用 `reset()`
- 暗色模式支持

### 3.3 骨架屏设计规范

- 使用 `animate-pulse` 动画
- 模拟实际布局结构（导航栏 → 标题 → 网格卡片）
- 支持暗色模式（`bg-slate-200 dark:bg-slate-700`）
- 卡片骨架高度与实际卡片一致（`h-64` 图片区 + 内容区）

### 3.4 验证

- 使用 Chrome DevTools Network throttling (Slow 3G) 验证骨架屏显示
- 验证 error.tsx 在 API 返回 500 时正确显示

---

## Phase 4：渲染优化

### 4.1 组件提取 + React.memo

| 组件 | memo 化理由 |
|------|------------|
| `BookCard` | 列表项，书籍列表重渲染时避免所有卡片都重渲染 |
| `StarRating` | 纯展示组件，rating 不变就不需要重渲染 |
| `BookCardSkeleton` | 骨架屏组件，静态无状态 |
| `Pagination` | 分页组件，仅在页码变化时重渲染 |

### 4.2 useCallback 稳定化回调

```typescript
// books/page.tsx
const handleToggleFavorite = useCallback((bookId: number, isFavorited: boolean) => {
  toggleFavorite.mutate({ bookId, isFavorited });
}, [toggleFavorite]);

const handleCategoryChange = useCallback((categoryId: string) => {
  setSelectedCategory(categoryId);
  setCurrentPage(1);
}, []);
```

### 4.3 useMemo 稳定派生数据

```typescript
// users/page.tsx
const filteredUsers = useMemo(() => {
  if (filter === "all") return users;
  if (filter === "admin") return users.filter(u => u.role === "ADMIN");
  // ...
}, [users, filter]);
```

### 4.4 Dynamic Import 重型组件

```typescript
// books/[id]/page.tsx
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <div className="animate-pulse h-40 bg-slate-200 dark:bg-slate-700 rounded" />,
});
```

### 4.5 搜索防抖

使用 `useDebounce` hook，搜索输入 300ms 防抖后才触发 API 请求。

### 4.6 验证

- React DevTools Profiler 验证 BookCard 切页不重渲染
- Network 面板验证防抖请求不再频繁
- Lighthouse 验证 JS bundle 减少（dynamic import）

---

## Phase 5：虚拟列表

### 5.1 安装依赖

```
npm install @tanstack/react-virtual
```

### 5.2 适用场景与优先级

| 页面 | 数据量 | 方案 | 优先级 |
|------|--------|------|--------|
| 管理后台 books 表格 | 可能>100 | 服务端分页（Phase 1 已做） | ✅ 已完成 |
| 管理后台 users 表格 | 可能>100 | 服务端分页（Phase 1 已做） | ✅ 已完成 |
| 管理后台 reviews | 可能>100 | 服务端分页（Phase 1 已做） | ✅ 已完成 |
| 书籍详情评论列表 | 可能>50 | 分页 + 懒加载 | Phase 5 |
| 收藏页面 | 通常<50 | 分页兜底 + 虚拟列表 | Phase 5 |

### 5.3 评论列表无限滚动

使用 React Query 的 `useInfiniteQuery` + `@tanstack/react-virtual`：

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ["reviews", bookId],
  queryFn: ({ pageParam }) => fetchReviews(bookId, pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.nextPage,
});

// 虚拟列表渲染评论
const virtualizer = useVirtualizer({
  count: hasNextPage ? flattenedReviews.length + 1 : flattenedReviews.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120,
  overscan: 5,
});
```

### 5.4 管理后台表格虚拟行（可选）

当管理后台单页数据量超过 50 条时，对 `<table>` 的 `<tbody>` 使用虚拟滚动：

```typescript
const virtualizer = useVirtualizer({
  count: filteredItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 64, // 每行高度
  overscan: 10,
});
```

### 5.5 验证

- 渲染 1000+ 条评论时页面不卡顿
- 滚动流畅度无下降
- 管理后台表格 100+ 行时渲染正常

---

## Phase 6：next.config.ts + 全局优化

### 6.1 next.config.ts 优化

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: [
      "react-markdown",
      "remark-gfm",
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      source: "/api/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store" },
      ],
    },
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
```

### 6.2 Admin 封面图优化

将 `<img>` 标签替换为 `next/image` 组件，利用自动图片优化和懒加载。

当前 admin/books 使用 `<img src={book.coverImageUrl}>`，需改为 `<Image>`。

### 6.3 验证

- Lighthouse Performance 分数提升
- 图片自动 WebP/AVIF 转换生效
- 安全 headers 正确返回
- 管理后台图片懒加载生效