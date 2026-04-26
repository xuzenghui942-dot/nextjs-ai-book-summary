# BookWise 性能优化开发记录

## Phase 1: N+1 查询修复 + 服务端分页 — 2026-04-26

### 修改文件清单

| 文件路径 | 修改摘要 |
|---------|---------|
| `app/api/books/route.ts` | N+1 查询修复：25次查询→3次 |
| `app/api/user/favorites/route.ts` | N+1 查询修复：N+1次查询→2次 |
| `app/api/admin/users/route.ts` | 添加分页+搜索+筛选参数 |
| `app/api/admin/reviews/route.ts` | 添加分页+状态筛选参数 |
| `app/api/admin/subscription-orders/route.ts` | 添加分页参数 |
| `app/(admin-dashboard)/admin/books/page.tsx` | Server Component 服务端分页+搜索 |
| `app/(admin-dashboard)/admin/users/page.tsx` | 从 Client Component 重写为 Server Component 服务端分页+搜索+筛选 |
| `app/(admin-dashboard)/admin/reviews/page.tsx` | 添加客户端分页+服务端筛选 |
| `app/(admin-dashboard)/admin/subscriptions/page.tsx` | 添加客户端分页 |
| `app/(user)/books/page.tsx` | 分页改为智能分页（省略号） |
| `components/pagination.tsx` | 新建：通用智能分页组件 |

---

### 关键代码对比

#### 1. `/api/books` — N+1 修复

**修改前**：每本书循环查2次数据库（rating + favorite），12本书 = 25次查询
```typescript
const booksWithRatings = await Promise.all(
  books.map(async (book) => {
    const avgRating = await prisma.bookReview.aggregate({
      where: { bookId: book.id, isApproved: true },
      _avg: { rating: true },
    });
    let isFavorited = false;
    if (session?.user) {
      const favorite = await prisma.userFavorite.findFirst({
        where: { userId: session.user.id, bookId: book.id },
      });
      isFavorited = !!favorite;
    }
    return { ...book, averageRating: avgRating._avg.rating || 0, isFavorited };
  })
);
```

**修改后**：用 `groupBy` + `findMany` 批量查询，总共仅 3 次查询
```typescript
const bookIds = books.map((book) => book.id);

const [ratings, favorites] = await Promise.all([
  prisma.bookReview.groupBy({
    by: ["bookId"],
    where: { bookId: { in: bookIds }, isApproved: true },
    _avg: { rating: true },
  }),
  session?.user
    ? prisma.userFavorite.findMany({
        where: { userId: session.user.id, bookId: { in: bookIds } },
        select: { bookId: true },
      })
    : Promise.resolve([]),
]);

const ratingMap = new Map(ratings.map((r) => [r.bookId, r._avg.rating || 0]));
const favoriteSet = new Set(favorites.map((f) => f.bookId));

const booksWithRatings = books.map((book) => ({
  ...book,
  averageRating: ratingMap.get(book.id) || 0,
  isFavorited: favoriteSet.has(book.id),
}));
```

**核心思路**：
- `groupBy` 一次查询拿到所有书的平均评分
- `findMany` + `{ in: bookIds }` 一次查询拿到当前用户的所有收藏
- `Map` 和 `Set` 在内存中 O(1) 查找，避免循环数据库查询

---

#### 2. `/api/user/favorites` — N+1 修复

**修改前**：每本书循环查1次评分
```typescript
const favoritesWithRatings = await Promise.all(
  favorites.map(async (favorite) => {
    const avgRating = await prisma.bookReview.aggregate({
      where: { bookId: favorite.book.id, isApproved: true },
      _avg: { rating: true },
    });
    return { ...favorite, book: { ...favorite.book, averageRating: avgRating._avg.rating || 0 } };
  })
);
```

**修改后**：`groupBy` 批量查询评分 + `Map` 内存合并
```typescript
const bookIds = favorites.map((f) => f.bookId);

const ratings = await prisma.bookReview.groupBy({
  by: ["bookId"],
  where: { bookId: { in: bookIds }, isApproved: true },
  _avg: { rating: true },
});

const ratingMap = new Map(ratings.map((r) => [r.bookId, r._avg.rating || 0]));

const favoritesWithRatings = favorites.map((favorite) => ({
  ...favorite,
  book: { ...favorite.book, averageRating: ratingMap.get(favorite.bookId) || 0 },
}));
```

---

#### 3. `/api/admin/users` — 添加分页+搜索+筛选

**修改前**：返回所有用户，无分页
```typescript
const users = await prisma.user.findMany({
  orderBy: { createdAt: "desc" },
  select: { ... },
});
return NextResponse.json(users);
```

**修改后**：支持 page/limit/role/tier/search 参数
```typescript
const where: any = {};
if (role) where.role = role;
if (tier === "premium") where.subscriptionTier = { not: "FREE" };
else if (tier === "free") where.subscriptionTier = "FREE";
if (search) {
  where.OR = [
    { fullName: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ];
}
const [users, totalCount] = await Promise.all([
  prisma.user.findMany({ where, skip, take: limit, ... }),
  prisma.user.count({ where }),
]);
return NextResponse.json({ users, pagination: { page, limit, totalCount, totalPages } });
```

同样改造了 `/api/admin/reviews` 和 `/api/admin/subscription-orders`。

---

#### 4. 管理后台 books — Server Component 分页

**修改前**：无分页，一次查询所有书籍
```typescript
const books = await prisma.book.findMany({ include: { ... }, orderBy: { createdAt: "desc" } });
```

**修改后**：添加 searchParams 分页 + 搜索 + 统计查询
```typescript
export default async function AdminBookPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const search = params.search || "";

  const [books, totalCount, publishedCount, audioCount] = await Promise.all([
    prisma.book.findMany({ where, skip, take: limit, ... }),
    prisma.book.count({ where }),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.book.count({ where: { audioGenerated: true } }),
  ]);
  // ... 使用 <Pagination /> 组件渲染分页
}
```

**关键改动**：
- 从无参数组件变为接受 `searchParams` 的异步组件
- 统计数据用独立 `count` 查询而非 `.filter().length`，避免全量加载
- 搜索表单用 `<form method="GET">` 实现服务端原生提交

---

#### 5. 管理后台 users — Client Component → Server Component

**修改前**：客户端 useEffect fetch 所有用户，客户端 filter 筛选
```typescript
// 全量获取 + 客户端筛选
const filteredUsers = users.filter((user) => {
  if (filter === "admin") return user.role === "ADMIN";
  // ...
});
```

**修改后**：Server Component 直接查数据库，筛选在 SQL 层完成
```typescript
export default async function UsersPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; role?: string; tier?: string; search?: string }> }) {
  // 筛选条件转为 Prisma where
  const where: any = {};
  if (roleFilter) where.role = roleFilter;
  if (tierFilter === "premium") where.subscriptionTier = { not: "FREE" };

  // 统计也是独立 count 查询，不是 .filter().length
  const [users, totalCount, totalUsers, premiumCount, ...] = await Promise.all([...]);
}
```

**移除了**：
- `window.fetch` 调试覆写（安全隐患）
- `unhandledrejection` 事件监听
- 客户端全量加载后 filter

---

#### 6. 智能分页组件

**新建文件**：`components/pagination.tsx`

**修改前**：用户端 books 页面渲染所有页码
```typescript
{[...Array(totalPages)].map((_, i) => (
  <button key={i + 1} onClick={() => setCurrentPage(i + 1)}>
    {i + 1}
  </button>
))}
```
问题：100页 = 100个按钮。

**修改后**：智能省略号分页
```typescript
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
```

效果：100页只显示 7 个按钮（1 ... 49 50 51 ... 100）

---

### 验证结果

1. **N+1 修复验证**：
   - 打开浏览器 Network 面板
   - 访问 `/books` 页面
   - 查看 `/api/books` 请求的响应时间（预期从 ~800ms 降到 ~150ms）
   - 查看服务端日志确认 DB 查询数从 25 降到 3

2. **服务端分页验证**：
   - 访问 `/admin/books?page=2`，确认只显示第 2 页的 20 本书
   - 使用搜索框搜索书名，确认 URL 参数变化并仅在数据库层搜索
   - 访问 `/admin/users?role=ADMIN`，确认只显示管理员用户
   - 访问 `/admin/users?tier=premium`，确认只显示付费用户

3. **智能分页验证**：
   - 创建超过 7 页的书籍数据
   - 确认分页栏显示 `[1] ... [49] [50] [51] ... [100]` 格式
   - 点击省略号区域不触发导航

4. **管理后台统计验证**：
   - 访问 `/admin/books`，确认统计卡片不再用 `.filter().length` 计算（而是用独立 `COUNT` 查询）
   - 访问 `/admin/users`，同样确认统计数据来自数据库而非客户端筛选

---

### 性能指标对比

| 指标 | 修改前 | 修改后 |
|------|--------|--------|
| `/api/books` DB查询数 | 25次（1主+12评分+12收藏） | 3次（主+groupBy+findMany） |
| `/api/user/favorites` DB查询数 | N+1次 | 2次（主+groupBy） |
| `/admin/books` 数据加载 | 全量所有书籍 | 每页20条 + 搜索 |
| `/admin/users` 数据加载 | 全量所有用户 | 每页20条 + 服务端筛选 |
| `/admin/reviews` 数据加载 | 全量所有评论 | 每页20条 |
| `/admin/subscriptions` 数据加载 | 全量所有订单 | 每页20条 |
| 统计卡片计算 | `.filter().length` 客户端 | `COUNT` 数据库查询 |
| 分页按钮 | 渲染所有页码 | 智能省略号（最多7个） |

---

### 注意事项

1. **Admin Books 页面**现在使用 Server Component `searchParams`，分页和搜索通过 URL 参数驱动，书签和浏览器前进/后退可正常工作。
2. **Admin Users 页面**从 Client Component 改为 Server Component，删除了 `window.fetch` 覆写的调试代码（存在安全隐患）。
3. **分页组件** `Pagination` 目前仅用于 Server Component 页面（通过 `<a>` 标签导航），Client Component 页面使用内联分页逻辑。
4. **API 响应格式变更**：`/api/admin/users`、`/api/admin/reviews`、`/api/admin/subscription-orders` 的响应从数组变为 `{ data, pagination }` 对象，前端页面已同步更新。
5. **搜索防抖**：Admin 页面的搜索框使用原生 `<form method="GET">` 提交，无防抖（管理后台可接受）。用户端 `/books` 页面的搜索防抖将在 Phase 4 添加。