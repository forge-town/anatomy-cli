import { z } from "zod/v4";

/** 单个结构条目相对于 Anatomy 默认策略的局部覆盖。 */
export const AnatomyPolicyOverridesSchema = z
  .object({
    /** 缺少必需条目时的局部处置。 */
    missingRequired: z.enum(["block", "warn", "allow"]),
    /** 出现未声明条目时的局部处置。 */
    unexpectedEntry: z.enum(["block", "warn", "allow"]),
    /** 条目名称不匹配时的局部处置。 */
    nameMismatch: z.enum(["block", "warn", "allow"]),
    /** 条目嵌套位置不匹配时的局部处置。 */
    nestingMismatch: z.enum(["block", "warn", "allow"]),
  })
  .partial();

export type AnatomyPolicyOverrides = z.infer<typeof AnatomyPolicyOverridesSchema>;
