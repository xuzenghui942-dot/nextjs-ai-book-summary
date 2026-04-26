# BookWise

BookWise 是一个基于 `Next.js`、`Prisma` 和 `MySQL` 构建的图书摘要平台项目，目标是提供图书摘要阅读、音频收听、订阅解锁与后台管理等能力。

当前项目仍处于基础搭建阶段，核心工作集中在项目初始化、数据库结构设计以及首页页面构建，业务功能尚未正式进入完整开发。

## 当前项目状态

目前已经完成的内容包括：

- 项目初始化
- Prisma 数据库搭建
- 首页构建

当前仓库中的主要实现集中在 [app/page.tsx](C:/Users/23879/Desktop/前端找实习全流程/项目/BookWise/bookwise/app/page.tsx) 和 [prisma/schema.prisma](C:/Users/23879/Desktop/前端找实习全流程/项目/BookWise/bookwise/prisma/schema.prisma)。

## 技术栈

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Prisma`
- `MySQL`
- `NextAuth`

## 开发流程记录

### 1. 项目初始化

项目最开始使用 `Next.js` 创建基础工程，并采用 `App Router` 作为页面组织方式。在此基础上完成了 `TypeScript`、`ESLint`、`Tailwind CSS` 等前端开发环境配置，保证后续页面开发和代码维护有统一的工程基础。

同时，项目安装了当前阶段会用到的主要依赖，包括数据库访问、身份认证、表单处理、密码加密和 AI 能力接入相关包，为后续业务功能开发预留了技术基础。

### 2. 目录结构预留

在基础工程完成后，对项目目录做了初步规划，在 `app` 目录下预留了 `(auth)`、`(user)`、`(admin-auth)`、`(admin-dashboard)`、`api` 等分组目录，用于后续扩展用户端页面、管理端页面以及接口层能力。

此外，还创建了 `components`、`lib`、`types` 等目录，方便后续继续拆分公共组件、数据库工具和类型定义。当前这些目录大多还处于预留阶段，尚未填入完整业务代码。

### 3. Prisma 数据模型设计

数据库部分已完成 `Prisma` 初始化，并配置 `MySQL` 作为当前项目的数据源。核心数据结构已经写入 [prisma/schema.prisma](C:/Users/23879/Desktop/前端找实习全流程/项目/BookWise/bookwise/prisma/schema.prisma)，为后续业务开发提供了完整的数据基础。

当前已经设计的主要模型包括：

- `User`
- `Category`
- `Book`
- `BookSummary`
- `BookChapter`
- `BookReview`
- `UserFavorite`
- `UserReadingHistory`
- `SubscriptionPlan`
- `PaymentTransaction`
- `SubscriptionOrder`
- `AdminActivityLog`
- `SystemSetting`

除基础表结构外，项目还定义了用户角色、订阅状态、订单状态、支付状态等枚举类型，用于支持后续的权限区分和业务流转。

### 4. 首页页面开发

首页首版已在 [app/page.tsx](C:/Users/23879/Desktop/前端找实习全流程/项目/BookWise/bookwise/app/page.tsx) 中完成，当前页面以静态展示为主，用于确定产品的视觉方向和基础信息结构。

已完成的首页模块包括：

- 顶部导航栏
- Hero 展示区
- 平台卖点展示区
- CTA 引导区
- Footer 页脚

当前首页中的 `Sign In`、`Get Started Free`、`Browse Library` 等入口已经预留，但对应页面和功能尚未进入正式开发阶段。

## 后续记录方式

后续开发建议继续采用“阶段追加”的方式维护本 README。每完成一个新阶段，继续补充以下内容：

- 本阶段开发目标
- 实际完成内容
- 涉及的页面、接口或数据表
- 当前遗留问题
- 下一阶段计划

这样可以让 README 持续保留真实开发过程，既方便自己回顾，也适合作为作品集项目的开发记录。
