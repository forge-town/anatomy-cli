import { z } from "zod/v4";
import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

export const AnatomyDraftCreateInputSchema = AnatomyDraftInputSchema.extend({
  id: z.string().uuid().optional(),
  workspaceId: z.string().optional(),
});

export type AnatomyDraftCreateInput = z.infer<typeof AnatomyDraftCreateInputSchema>;
