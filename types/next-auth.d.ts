import { UserRole, SubscriptionTier } from "@prisma/client";
import { DefaultSession } from "next-auth";
/**
 * 让ts 认识我自定义的用户字段
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      subscriptionTier: SubscriptionTier;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    subscriptionTier?: SubscriptionTier;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: UserRole;
    subscriptionTier?: SubscriptionTier;
  }
}
