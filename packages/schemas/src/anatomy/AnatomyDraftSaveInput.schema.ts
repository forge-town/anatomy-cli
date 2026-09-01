import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

/** Anatomy 草稿保存操作的输入契约。 */
export const AnatomyDraftSaveInputSchema = AnatomyDraftInputSchema.extend({
  /** 用于乐观并发控制的预期草稿修订号。 */
  expectedRevision: z.number().int().positive(),
});

export type AnatomyDraftSaveInput = z.infer<typeof AnatomyDraftSaveInputSchema>;
