import { z } from "zod";

export const booksQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  category: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type BooksQueryInput = z.infer<typeof booksQuerySchema>;
