import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

/** Anatomy 定义发布后不可变的历史快照。 */
export const AnatomyVersionSchema = AnatomyDraftInputSchema.extend({
  /** 版本记录的唯一标识。 */
  id: z.string(),
  /** 版本所属 Anatomy 的标识。 */
  anatomyId: z.string(),
  /** 在同一 Anatomy 内递增的版本号。 */
  version: z.number().int().positive(),
  /** 该版本正式发布时间。 */
  publishedAt: z.date(),
  /** 当前引用该版本的 Crate 数量。 */
  usageCount: z.number().int().nonnegative(),
});

export type AnatomyVersion = z.infer<typeof AnatomyVersionSchema>;
