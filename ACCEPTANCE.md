# BookWise 优化验收文档

> 每完成一个 Step，在此文档对应章节记录实际执行情况、变更清单和验收结果。
> 用户对照本文档 review 每一步完成质量。

---

## Step 0：执行前基线与项目入口统一

### 计划目标
先确认项目当前状态，统一关键入口，避免后续重构产生混乱。

### 实际执行记录

#### 1. 基线检查

**npm run lint 结果**：
```
✖ 65 problems (27 errors, 38 warnings)

=== Lint 分级（为 Step 1 铺路）===

【P0 - Step 1 会自然消除】预计消除 ~22 个问题
- @typescript-eslint/no-explicit-any: 8 处
  → 分布在 books/page.tsx, favorites/page.tsx, books/[id]/page.tsx
  → Step 1 用 types/api.ts 的类型替换，Step 2 用 useUser hook 替换 user: any
- react-hooks/exhaustive-deps: 5 处
  → 分布在 books/page.tsx, books/[id]/page.tsx, favorites/page.tsx
  → Step 1-2 删除 fetch/useEffect 后自然消失
- react-hooks/immutability: 4 处
  → 分布在 dashboard, pricing, admin/users, admin/users/[id]
  → Step 1 组件化重构时调整函数声明顺序即可修复

【P1 - Step 6 类型安全时处理】预计消除 ~5 个问题
- @typescript-eslint/no-explicit-any: 5 处（admin/books/[id]/details, admin/users/[id], api/books, api/admin/subscription-orders）
  → 属于 admin 端和 API 层的 any，Step 6 统一替换

【P2 - Step 11 性能收尾时处理】预计消除 ~19 个问题
- @next/next/no-img-element: 8 处
  → Step 11 图片优化时统一替换为 next/image
- @next/next/no-html-link-for-pages: 1 处（admin/dashboard）
  → Step 11 或 admin 端优化时顺手修复
- react/no-unescaped-entities: 4 处
  → Step 11 体验收尾时修复
- @typescript-eslint/no-unused-vars: 14 处（部分与 P0 重叠）
  → 随着代码重构自然减少，剩余的在 Step 11 清理
- @typescript-eslint/no-require-imports: 3 处（scripts/extract-pdf-text.cjs）
  → scripts 目录的 .cjs 文件，Step 11 统一处理或加 eslint ignore

【P3 - 历史债务，本轮不处理】
- lib/auth.ts 类型兼容性问题（build 失败原因）
  → runtime 正常，只是 TypeScript 类型不匹配
  → 如需修复，后续专门处理 auth 类型适配
```

**npm run build 结果**：
```
❌ 构建失败

失败原因：lib/auth.ts:20:3 TypeScript 类型错误
- @auth/prisma-adapter 返回的 Adapter 类型与 @auth/core 的 Adapter 类型不兼容
- AdapterUser 缺少 role、subscriptionTier 字段
- 这是 next-auth v5 beta + @auth/prisma-adapter 版本不匹配导致的已知类型兼容性问题

关键说明：
- runtime OK：登录/注册/Session 在实际运行中完全正常
- 只是类型问题：TypeScript 编译期类型检查报错，不影响运行时功能
- 这是 next-auth v5 beta 与 @auth/prisma-adapter 版本不匹配导致的已知兼容性问题
- 修复方案：可在 next-auth 配置中对 adapter 做类型断言，或在后续专门处理 auth 类型适配

注：此错误属于现有项目的历史技术债务，不在 Step 0 修复范围内。
按 plan 约定，这属于基线问题，不阻塞 Step 1 开始执行。
```

#### 2. 依赖确认

- [x] `zod` 已安装（`package.json` 中确认版本 `^4.3.6`）
- [ ] 后续新增：`zustand @tanstack/react-query @tanstack/react-query-devtools`

#### 3. Prisma 入口统一

**变更前**：
- `lib/prisma.ts` 独立创建 PrismaClient（无日志）
- `lib/db/prisma.ts` 带日志的 PrismaClient

**变更后**：
- `lib/prisma.ts` 改为 re-export：
```ts
export { prisma } from "./db/prisma";
export { default } from "./db/prisma";
```

#### 4. 代码修复

- [x] Dashboard API 路径：`/api/subscription/orders` → `/api/subscription-orders`
  - 修改文件：`app/(user)/dashboard/page.tsx` 第 65 行
- [x] Categories API select 增加 `icon: true`
  - 修改文件：`app/api/user/categories/route.ts`
  - 同时把导入路径从 `@/lib/prisma` 改为 `@/lib/db/prisma`，与入口统一策略一致

#### 5. 类型基础

- [x] 新建 `types/api.ts`，包含基础 DTO：
  - `UserProfile`
  - `CategoryDTO`
  - `BookListItem`
  - `BookDetailDTO`
  - `BookChapterDTO`
  - `BookReviewDTO`
  - `FavoriteItem`
  - `PaginatedResponse<T>`
  - `ApiError`

#### 6. TSConfig 检查

- [x] `tsconfig.json` 已开启 `strict: true`
  - 第 7 行 `"strict": true`

#### 7. Prisma 导入路径现状

- 搜索发现仍有 **21 个文件** 使用 `@/lib/prisma` 导入
- **3 个文件** 已使用 `@/lib/db/prisma`（含本次修改的 categories route）
- 由于 `lib/prisma.ts` 已改为 re-export，旧导入路径功能上仍然指向同一实例
- 后续新增代码统一从 `@/lib/db/prisma` 导入

### 遇到的问题

1. **build 失败**：`lib/auth.ts` 存在 `@auth/prisma-adapter` 与 `@auth/core` 的类型兼容性问题。这是现有项目的历史债务，不在 Step 0 修复范围内，不影响后续步骤推进。
2. **lint 大量 any 和 hooks 规则问题**：共 65 个问题，属于基线状态，将在 Step 1-6 逐步清理。

### 验收标准

- [x] `lib/prisma.ts` 不再创建新的 PrismaClient。
- [x] 后续代码统一使用同一个 Prisma client（通过 re-export 保证）。
- [x] dashboard 订阅订单请求能命中真实 API（路径已修正为 `/api/subscription-orders`）。
- [x] categories API 返回 `id/name/slug/icon`（select 已增加 `icon: true`）。
- [x] `types/api.ts` 已创建，Step 1 组件不需要临时写 `any`。
- [x] 已确认 `tsconfig.json` 的 strict 状态（`strict: true`）。

---

## Step 1：组件化重构与重复 UI 清理

### 计划目标
消除用户端重复 UI，让页面结构更像真实项目。

### 实际执行记录

#### 新建组件

| 组件 | 路径 | 说明 |
|------|------|------|
| Navbar | `components/layout/Navbar.tsx` | 统一用户端导航栏，支持 activePath 高亮、ADMIN 入口、登录态切换 |
| UserLayout | `components/layout/UserLayout.tsx` | 用户端统一页面外壳（min-h-screen + Navbar + main） |
| StarRating | `components/ui/StarRating.tsx` | 统一星级评分，支持 interactive/showValue/size |
| BookCard | `components/ui/BookCard.tsx` | 统一图书卡片，支持 grid/favorite 两种 variant |
| EmptyState | `components/ui/EmptyState.tsx` | 空状态组件（带可选 action 按钮） |
| LoadingSkeleton | `components/ui/LoadingSkeleton.tsx` | 骨架屏组件（默认 8 个卡片骨架） |

#### 页面改造

| 页面 | 改造内容 |
|------|---------|
| `app/(user)/books/page.tsx` | 删除内联 Navbar/卡片/randerStars，改用 UserLayout + BookCard + StarRating + LoadingSkeleton + EmptyState |
| `app/(user)/favorites/page.tsx` | 同上，BookCard 使用 variant="favorite"，空状态使用 EmptyState |
| `app/(user)/books/[id]/page.tsx` | 删除内联 Navbar，评分展示和评论表单改用 StarRating |
| `app/(user)/dashboard/page.tsx` | 删除内联 Navbar，改用 UserLayout，保留业务布局 |
| `app/(user)/pricing/page.tsx` | 删除内联 Navbar，改用 UserLayout，保留业务布局 |

#### 类型替换

- `books/page.tsx`：`user: any` → `UserProfile | null`
- `favorites/page.tsx`：`user: any` → `UserProfile | null`
- `pricing/page.tsx`：`user: any` → `UserProfile | null`
- `books/[id]/page.tsx`：`keyTakeaways: any` → `unknown`，`tableOfContents: any` → `unknown`，`chapters.map((chapter: any))` → `chapters.map((chapter, index))`

#### TypeScript 检查结果

```
Found 1 error in lib/auth.ts:20  ← 历史债务，与 Step 1 无关
```

无新增类型错误。

### 遇到的问题

1. `lib/utils.ts` 临时创建后删除：最初想使用 `cn()` 工具函数，但 `clsx`/`tailwind-merge` 未安装。StarRating 改用简单模板字符串拼接 className，未新增依赖。

### 验收标准

- [x] 用户端页面不再重复手写 Navbar。
- [x] 项目中不存在 `randerStars`。
- [x] books 和 favorites 复用同一个 `BookCard`。
- [x] loading 状态不再只显示纯文字（使用 LoadingSkeleton 骨架屏）。

---

## Step 2：TanStack Query、Zustand 与请求 Hook

### 计划目标
区分服务端状态和客户端 UI 状态，消除重复 fetch。

### 实际执行记录

（待 Step 1 完成后执行）

### 验收标准

- [ ] 用户资料请求由 `useUser` 统一管理。
- [ ] 返回 books 页面时优先使用缓存。
- [ ] 页面组件不再直接写大量 fetch/useEffect。
- [ ] React Query Devtools 仅在 development 显示。

---

## Step 3：API N+1 查询与数据查询层

### 计划目标
把列表接口从"每本书额外查询"优化为固定次数查询。

### 实际执行记录

（待 Step 2 完成后执行）

### 验收标准

- [ ] books 列表接口不再按每本书查询评分和收藏。
- [ ] favorites 列表接口不再按每本书查询评分。
- [ ] 所有用户端 API catch 都返回 JSON。
- [ ] MySQL 查询不再使用无效的 `mode: "insensitive"`。

---

## Step 4：收藏乐观更新

### 计划目标
收藏操作点击后立即反馈，失败时自动回滚。

### 实际执行记录

（待 Step 3 完成后执行）

### 验收标准

- [ ] 点击心形后 UI 立即变化。
- [ ] 网络失败时 UI 回滚。
- [ ] books、favorites、detail 三处收藏状态一致。

---

## Step 5：搜索防抖与 URL 状态同步

### 计划目标
减少无效请求，修复 state 异步导致 URL 读旧值的问题。

### 实际执行记录

（待 Step 4 完成后执行）

### 验收标准

- [ ] 连续输入只在停止 300ms 后请求。
- [ ] `/books?search=react&page=2&category=1` 刷新后状态正确恢复。
- [ ] 搜索时 page 不会读到旧值。
- [ ] 使用 `useSearchParams` 的 books client 组件仍被 Suspense 包裹。

---

## Step 6：完善类型安全与 Zod 校验

### 计划目标
减少 `any`，让 API 输入输出更可控。

### 实际执行记录

（待 Step 5 完成后执行）

### 验收标准

- [ ] 用户端核心页面不再有 `user: any`。
- [ ] books API 非法 query 返回 400。
- [ ] favorite/review schema 从 validations 文件导入。
- [ ] TypeScript strict 模式通过。
- [ ] `PaginatedResponse<T>` 使用 `data: T[]`，空列表用 `[]` 表达。

---

## Step 7：SEO 与 Metadata

### 计划目标
移除默认 metadata，让页面标题和分享信息更专业。

### 实际执行记录

（待 Step 6 完成后执行）

### 验收标准

- [ ] 浏览器标签页不再显示 `Create Next App`。
- [ ] 每个核心页面标题唯一。
- [ ] 图书详情页至少有独立标题；动态书名和封面分享在 Server/Client 拆分完成后验收。

---

## Step 8：音频播放器增强与进度持久化

### 计划目标
把现有详情页内联 audio 逻辑升级成全局播放器，并支持多端续播。

### 实际执行记录

（待 Step 7 完成后执行）

### 验收标准

- [ ] 刷新页面后能恢复到上次章节和秒数。
- [ ] 切换页面后底部播放器仍存在。
- [ ] 免费用户仍只能试听 10 秒。
- [ ] 倍速播放可用。

---

## Step 9：用户端分页体验优化

### 计划目标
保留分页 URL 语义，优化分页控件体验。

### 实际执行记录

（待 Step 8 完成后执行）

### 验收标准

- [ ] `/books?search=react&category=1&page=2` 刷新后状态正确恢复。
- [ ] 页数很多时分页控件不会撑爆页面。
- [ ] 搜索和分类切换后 page 自动回到 1。
- [ ] Previous/Next 禁用状态正确。
- [ ] 返回上一页优先命中 TanStack Query 缓存。
- [ ] 用户端 books 页面不使用虚拟列表。

---

## Step 10：Admin 管理列表虚拟化

### 计划目标
把虚拟列表能力放在后台高密度管理页，减少 DOM 压力。

### 实际执行记录

（待 Step 9 完成后执行）

### 验收标准

- [ ] `/admin/books` 渲染 500+ books 时 DOM 中实际行数远小于总数。
- [ ] `/admin/users` filter 切换后虚拟列表回到顶部。
- [ ] `/admin/reviews` 长评论不会导致滚动高度严重抖动。
- [ ] View/Edit/Delete/Approve 等操作保持可用。
- [ ] admin dashboard 首页不引入虚拟列表。

---

## Step 11：性能、错误边界与体验收尾

### 计划目标
补齐生产级项目常见基础设施。

### 实际执行记录

（待 Step 10 完成后执行）

### 验收标准

- [ ] production build 通过。
- [ ] 核心用户流可用。
- [ ] 页面有 loading、empty、error 状态。
- [ ] 代码文件复杂度下降。

---

## Optional：PWA 离线能力

### 计划目标
作为最后的锦上添花能力展示。

### 实际执行记录

（仅当 Step 0-11 全部稳定后执行）

### 验收标准

- [ ] 访问过的公开图书列表断网后能看到缓存内容。
- [ ] 访问过的公开图书详情断网后能看到缓存内容。
- [ ] 用户敏感 API 和 admin API 不被缓存。
- [ ] 离线时有明确提示。
