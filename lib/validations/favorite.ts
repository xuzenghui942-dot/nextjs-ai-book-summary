import { z } from "zod";

export const favoriteBodySchema = z.object({
  bookId: z.number().int().positive(),
});

export type FavoriteBodyInput = z.infer<typeof favoriteBodySchema>;
