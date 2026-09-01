import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

/** Anatomy 发布前可持续编辑的工作草稿。 */
export const AnatomyDraftSchema = AnatomyDraftInputSchema.extend({
  /** 草稿记录的唯一标识。 */
  id: z.string(),

  /** 草稿所属 Anatomy 的标识。 */
  anatomyId: z.string(),
  /** 草稿基于的历史版本；从空白创建时为 null。 */
  basedOnVersionId: z.string().nullable(),
  /** 用于乐观并发控制的草稿修订号。 */
  revision: z.number().int().positive(),

  /** 草稿创建时间。 */
  createdAt: z.date(),
  /** 草稿最近保存时间。 */
  updatedAt: z.date(),
});

export type AnatomyDraft = z.infer<typeof AnatomyDraftSchema>;
