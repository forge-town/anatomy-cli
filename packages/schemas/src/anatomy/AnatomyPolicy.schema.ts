import { z } from "zod/v4";
import { AnatomyPolicyValueSchema } from "./AnatomyPolicyValue.schema";

/** Crate 与 Anatomy 结构不一致时的默认处置策略。 */
export const AnatomyPoliciesSchema = z.object({
  /** 缺少必需条目时的默认处置。 */
  missingRequired: AnatomyPolicyValueSchema,
  /** 出现未声明条目时的默认处置。 */
  unexpectedEntry: AnatomyPolicyValueSchema,
  /** 条目名称不匹配时的默认处置。 */
  nameMismatch: AnatomyPolicyValueSchema,
  /** 条目嵌套位置不匹配时的默认处置。 */
  nestingMismatch: AnatomyPolicyValueSchema,
});

/** Anatomy 默认策略的类型。 */
export type AnatomyPolicies = z.infer<typeof AnatomyPoliciesSchema>;
