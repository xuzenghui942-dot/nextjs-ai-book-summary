import { z } from "zod";

export const readingHistoryPatchSchema = z.object({
  chapterIndex: z.number().int().min(0),
  audioPosition: z.number().int().min(0),
  completionPercentage: z.number().int().min(0).max(100),
});

export type ReadingHistoryPatchInput = z.infer<typeof readingHistoryPatchSchema>;
