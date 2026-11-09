import { z } from "zod/v4";

export const AnatomyCompletionSchema = z.object({
  choices: z.array(z.object({
    finish_reason: z.string().nullable().optional(),
    message: z.object({ content: z.string().min(1) }),
  })).min(1),
});
export type AnatomyCompletion = z.infer<typeof AnatomyCompletionSchema>;
