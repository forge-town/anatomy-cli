import { z } from "zod/v4";

import { AnatomyStructureSchema } from "./AnatomyStructure.schema";

/** 创建或替换 Anatomy 草稿时由作者维护的定义。 */
export const AnatomyDraftInputSchema = z.object({
  /** 面向使用者展示的 Anatomy 名称。 */
  name: z.string().trim().min(1).max(120),
  /** 该结构规范解决的问题和适用目的。 */
  purpose: z.string().trim().max(2000),
  /** 文件与目录组成的递归结构契约。 */
  structure: AnatomyStructureSchema,
});

export type AnatomyDraftInput = z.infer<typeof AnatomyDraftInputSchema>;
