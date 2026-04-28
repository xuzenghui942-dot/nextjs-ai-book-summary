import { z } from "zod";

export const userIdSchema = z.string().uuid();

export type UserIdInput = z.infer<typeof userIdSchema>;
