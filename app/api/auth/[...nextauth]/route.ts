import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
/**
 * 放在 catch - all - route 这个路径下面
 * 把Auth.js提供的handles 接到next.js系统里面
 *
 */
