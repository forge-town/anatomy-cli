import type { AnatomyPolicies } from "@anatomy-cli/schemas";

/** 某个策略键最终生效的值及其来源层级。 */
export type ResolvedAnatomyPolicy = {
  /** 解析后实际执行的策略值。 */
  value: AnatomyPolicies[keyof AnatomyPolicies];
  /** 策略来自当前条目、父条目还是 Anatomy 默认值。 */
  source: "entry" | "parent" | "anatomy";
  /** 提供覆盖值的条目标识；使用默认值时不存在。 */
  sourceEntryId?: string;
};
