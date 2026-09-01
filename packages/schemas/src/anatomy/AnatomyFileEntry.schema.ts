import { z } from "zod/v4";

import { AnatomyNameExpressionSchema } from "./AnatomyNameExpression.schema";
import { AnatomyPolicyOverridesSchema } from "./AnatomyPolicyOverrides.schema";
import { AnatomyQuantitySchema } from "./AnatomyQuantity.schema";

/** Anatomy 树中的文件要求，包含命名、数量和策略约束。 */
export const AnatomyFileEntrySchema = z.object({
  /** 文件条目的唯一标识；省略时由 schema 解析阶段生成。 */
  id: z.string().uuid().default(() => crypto.randomUUID()),
  /** 文件名的固定值或占位表达式。 */
  name: AnatomyNameExpressionSchema,
  /** 允许该文件出现的数量范围。 */
  quantity: AnatomyQuantitySchema,
  /** 相对于 Anatomy 默认策略的局部覆盖。 */
  policyOverrides: AnatomyPolicyOverridesSchema.default({}),
  /** 节点判别字段，固定为文件。 */
  kind: z.literal("file"),
});

export type AnatomyFileEntry = z.infer<typeof AnatomyFileEntrySchema>;
