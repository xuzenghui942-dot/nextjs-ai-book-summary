import { PrismaClient } from "@prisma/client"; // 连接db并且执行增删改查
import bcrypt from "bcryptjs"; // 给管理员密码做哈希 避免明文存库
/**
 * 给数据库写入一批初始数据 方便本地开发 联调 演示和测试
 */
const prisma = new PrismaClient();
async function main() {
  console.log("Seeding database...");
  // Seed Categories
  const categories = [
    {
      name: "Business & Finance",
      slug: "business-finance",
      description: "Books about business, entrepreneurship, and finance",
      icon: "💼",
      displayOrder: 1,
    },
    {
      name: "Self-Help & Personal Development",
      slug: "self-help",
      description: "Books about personal growth and self-improvement",
      icon: "🌟",
      displayOrder: 2,
    },
    {
      name: "Psychology & Mental Health",
      slug: "psychology",
      description: "Books about psychology, mental health, and well-being",
      icon: "🧠",
      displayOrder: 3,
    },
    {
      name: "Science & Technology",
      slug: "science-technology",
      description: "Books about science, technology, and innovation",
      icon: "🔬",
      displayOrder: 4,
    },
    {
      name: "History & Biography",
      slug: "history-biography",
      description: "Books about historical events and notable people",
      icon: "📜",
      displayOrder: 5,
    },
    {
      name: "Health & Fitness",
      slug: "health-fitness",
      description: "Books about health, fitness, and nutrition",
      icon: "💪",
      displayOrder: 6,
    },
    {
      name: "Philosophy & Religion",
      slug: "philosophy-religion",
      description: "Books about philosophy, spirituality, and religion",
      icon: "🕉️",
      displayOrder: 7,
    },
    {
      name: "Productivity & Time Management",
      slug: "productivity",
      description: "Books about productivity, efficiency, and time management",
      icon: "⏰",
      displayOrder: 8,
    },
    {
      name: "Leadership & Management",
      slug: "leadership",
      description: "Books about leadership, management, and team building",
      icon: "👔",
      displayOrder: 9,
    },
    {
      name: "Marketing & Sales",
      slug: "marketing-sales",
      description: "Books about marketing, sales, and customer relations",
      icon: "📈",
      displayOrder: 10,
    },
    {
      name: "Communication & Social Skills",
      slug: "communication",
      description: "Books about communication and interpersonal skills",
      icon: "💬",
      displayOrder: 11,
    },
    {
      name: "Creativity & Innovation",
      slug: "creativity",
      description: "Books about creativity, innovation, and design thinking",
      icon: "🎨",
      displayOrder: 12,
    },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("Categories seeded successfully");
  // 创建一个admin用户来测试
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@bookwise.com" },
    update: {},
    create: {
      email: "admin@bookwise.com",
      fullName: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      subscriptionTier: "LIFETIME",
      subscriptionStatus: "ACTIVE",
      emailVerified: true,
    },
  });
  console.log("Admin user created successfully");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
/**
 * 出错时打印错误并退出进程
 * 不管成功失败 最后都断开数据库连接 避免脚本挂着不退出
 */
/**
 * 安装ts-node-dev后 可以直接用ts-node-dev来运行这个seed脚本 这样修改后就不需要重新编译了
 * npx prisma db seed(不行了 因为用的是prisma第七版)
 * npx tsx prisma/seed.ts
 * 主要不是Prisma 6,19,2 本身的问题
 * 我的项目里缺少Prisma seed 命令配置
 * prisma db seed = Prisma 帮你调用 预先配置好的seed命令
 * npx tsx prisma/seed.ts = 绕过了Prisma 自己直接跑脚本
 * 如果想让第一条成功 应该在package.json里添加
 * {
 "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}

 */
