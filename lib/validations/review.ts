import { z } from "zod";

export const reviewBodySchema = z.object({
  bookId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
});

export type ReviewBodyInput = z.infer<typeof reviewBodySchema>;
