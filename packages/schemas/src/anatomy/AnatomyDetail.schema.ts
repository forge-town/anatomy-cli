import { z } from "zod/v4";

import { AnatomyDraftSchema } from "./AnatomyDraft.schema";
import { AnatomyVersionSchema } from "./AnatomyVersion.schema";

/** Anatomy 的完整聚合视图，包含草稿、历史版本和使用情况。 */
export const AnatomyDetailSchema = z.object({
  /** Anatomy 的唯一标识。 */
  id: z.string(),

  /** 归档时间；未归档时为 null。 */
  archivedAt: z.date().nullable(),
  /** 当前可编辑草稿；没有草稿时为 null。 */
  draft: AnatomyDraftSchema.nullable(),
  /** 按发布时间保存的不可变版本列表。 */
  versions: z.array(AnatomyVersionSchema),
  /** 当前被 Crate 引用的次数。 */
  usageCount: z.number().int().nonnegative(),

  /** 首次创建时间。 */
  createdAt: z.date(),
  /** 最近更新时间。 */
  updatedAt: z.date(),
});

export type AnatomyDetail = z.infer<typeof AnatomyDetailSchema>;
