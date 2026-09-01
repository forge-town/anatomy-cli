import { z } from "zod/v4";

/** 用于列表和选择器的精简 Anatomy 视图。 */
export const AnatomySummarySchema = z.object({
  /** Anatomy 的唯一标识。 */
  id: z.string(),
  /** Anatomy 的展示名称。 */
  name: z.string(),
  /** Anatomy 的设计目的。 */
  purpose: z.string(),
  /** 归档时间；未归档时为 null。 */
  archivedAt: z.date().nullable(),
  /** 首次创建时间。 */
  createdAt: z.date(),
  /** 最近更新时间。 */
  updatedAt: z.date(),
  /** 是否存在可继续编辑的草稿。 */
  hasDraft: z.boolean(),
  /** 最新发布版本号；从未发布时为 null。 */
  latestVersion: z.number().int().positive().nullable(),
  /** 当前被 Crate 引用的次数。 */
  usageCount: z.number().int().nonnegative(),
});

export type AnatomySummary = z.infer<typeof AnatomySummarySchema>;
