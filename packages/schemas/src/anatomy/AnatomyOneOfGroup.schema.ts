import { z } from "zod/v4";

import { AnatomyEntrySchema, type AnatomyEntry } from "./AnatomyEntry.schema";

/** Anatomy 树中要求在多个候选条目间满足数量约束的互斥组。 */
export const AnatomyOneOfGroupSchema: z.ZodType<{
  id: string;
  kind: "one_of";
  minimumMatches: number;
  maximumMatches: number;
  alternatives: AnatomyEntry[];
}> = z.object({
  /** 互斥组的唯一标识；省略时由 schema 解析阶段生成。 */
  id: z.string().uuid().default(() => crypto.randomUUID()),
  /** 节点判别字段，固定为候选组。 */
  kind: z.literal("one_of"),
  /** 至少需要匹配的候选数量。 */
  minimumMatches: z.number().int().min(1),
  /** 最多允许匹配的候选数量。 */
  maximumMatches: z.number().int().min(1),
  /** 可供匹配的文件或目录候选项。 */
  alternatives: z.array(z.lazy(() => AnatomyEntrySchema)).min(2),
});

export type AnatomyOneOfGroup = z.infer<typeof AnatomyOneOfGroupSchema>;
