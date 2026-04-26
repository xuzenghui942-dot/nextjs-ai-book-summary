import NextAuth from "next-auth"; // 认证系统总入库
import CredentialsProvider from "next-auth/providers/credentials"; // 要做邮箱密码登录
// 登录方式是什么 校验 校验成功之后要保存哪些信息
import { PrismaAdapter } from "@auth/prisma-adapter"; // 让Auth.js知道数据层用的prisma
import { prisma } from "@/lib/db/prisma"; //登录查数据库用
//“认证系统怎么和数据库连起来？”
import bcrypt from "bcryptjs"; // 密码不能明文比较 只能hash比较
import { UserRole, SubscriptionTier } from "@prisma/client"; // 给ts用的业务类型
/**
 * 验证用户邮箱和密码
 */
/**signIn
通常用于执行登录动作
signOut
通常用于执行退出登录动作
auth
通常用于服务端读取当前登录状态，比如： */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // 我的用户数据是放在 Prisma 管理的数据库里的，你们可以按这个适配器和数据库协作
  adapter: PrismaAdapter(prisma), // 数据库怎么接
  session: {
    // 会话怎么保存
    strategy: "jwt", //登录后，把用户身份信息主要放在 JWT 这条链路里管理
  },
  pages: {
    // 登录 or 错误 跳转到哪里
    signIn: "/login", // 不用默认登录页 用我自己项目里面的页面
    error: "/login",
  },
  providers: [
    // 支持哪些登录方式
    // 凭证提供
    CredentialsProvider({
      // 用户自己输入凭证来登录
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        //  用户提交邮箱和密码后 我怎么证明它真的时这个人
        // 判断Email和 密码 有没有传进来
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password is required");
        }
        // 去数据库寻找这个邮箱的用户
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });
        if (!user || !user.passwordHash) {
          //查到了用户 但这个用户又没passwordHash 1) 用第三方OAuth 没有本地密码
          throw new Error("Invalid email or password");
        }
        // 用bcrypt.compare() 对比用户输入的密码和数据库里的加密密码
        // 如果没有bcrypt.compare() 只要数据库里查得到这个邮箱 对方就能直接登录
        const isPasswordVaild = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash // 这个不能反解回明文
        );

        if (!isPasswordVaild) {
          throw new Error("Invalid email or password");
        }

        // 验证通过就返回一个用户对象 (后面会用这个用户对象去生成token和session)
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
  ],
  // 登录成功了 怎么在别的页面知道这个人是谁 ? 他的角色是什么
  callbacks: {
    // jwt登陆后哪些信息带着走
    async jwt({ token, user }) {
      // 用户刚登录时，把 id、role、subscriptionTier 放进 token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionTier = user.subscriptionTier;
      }
      return token;
    },
    /**token 更像认证内部保存的数据
session 更像项目业务代码经常直接使用的数据 */
    async session({ session, token }) {
      if (session.user) {
        // 项目里读取session时能看到哪些字段
        /**
         * 如果没有这里面的赋值操作 role还在token里 项目里常用的session.user拿不到
         * 前端页面 服务端鉴权 管理员页面判断这些地方可能不知道当前用户是不是admin
         */
        //把认证内部保存的数据，整理成项目里方便直接使用的 session 结构
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        // 在赋值给session的时候要明确告诉ts这是什么类型
        session.user.subscriptionTier =
          token.subscriptionTier as SubscriptionTier;
      }
      return session;
    },
  },
});
