import { z } from "zod/v4";

import { AnatomyStatusSchema } from "./AnatomyStatus.schema";

/** Anatomy 分页列表查询的输入契约。 */
export const AnatomyListInputSchema = z.object({
  /** 用于名称或说明模糊匹配的搜索词。 */
  search: z.string().trim().optional(),
  /** Anatomy 生命周期状态过滤条件。 */
  status: AnatomyStatusSchema.optional(),
  /** 从一开始计数的页码。 */
  page: z.number().int().positive().optional(),
  /** 每页最多返回的记录数。 */
  pageSize: z.number().int().positive().max(100).optional(),
});

export type AnatomyListInput = z.infer<typeof AnatomyListInputSchema>;
