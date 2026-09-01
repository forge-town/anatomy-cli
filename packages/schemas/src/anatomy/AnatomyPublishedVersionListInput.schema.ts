import { z } from "zod/v4";

/** Anatomy 已发布版本列表查询的输入契约。 */
export const AnatomyPublishedVersionListInputSchema = z.object({
  /** 用于版本名称或用途模糊匹配的搜索词。 */
  search: z.string().trim().optional(),
  /** 限定所属 Anatomy 的标识。 */
  anatomyId: z.string().optional(),
  /** 从一开始计数的页码。 */
  page: z.number().int().positive().optional(),
  /** 每页最多返回的版本数。 */
  pageSize: z.number().int().positive().max(100).optional(),
});

export type AnatomyPublishedVersionListInput = z.infer<
  typeof AnatomyPublishedVersionListInputSchema
>;
