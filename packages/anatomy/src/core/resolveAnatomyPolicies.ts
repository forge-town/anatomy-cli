import type { AnatomyPolicies, AnatomyPolicyOverrides } from "@anatomy-cli/schemas";
import type { ResolvedAnatomyPolicy } from "./ResolvedAnatomyPolicy";

/** 按“当前条目、最近父条目、Anatomy 默认值”的优先级解析策略。 */
export const resolveAnatomyPolicies = (
  defaults: AnatomyPolicies,
  ancestors: Array<{
    /** 父级条目的唯一标识，用于记录策略来源。 */
    id: string;
    /** 父级条目对 Anatomy 默认策略的局部覆盖。 */
    overrides: AnatomyPolicyOverrides;
  }>,
  entry?: {
    /** 当前条目的唯一标识，用于记录策略来源。 */
    id: string;
    /** 当前条目对继承策略的局部覆盖。 */
    overrides: AnatomyPolicyOverrides;
  },
): Record<keyof AnatomyPolicies, ResolvedAnatomyPolicy> => {
  const keys = Object.keys(defaults) as Array<keyof AnatomyPolicies>;
  const resolved = {} as Record<keyof AnatomyPolicies, ResolvedAnatomyPolicy>;

  for (const key of keys) {
    const entryValue = entry?.overrides[key];
    if (entryValue !== undefined && entry) {
      resolved[key] = {
        value: entryValue,
        source: "entry",
        sourceEntryId: entry.id,
      };
      continue;
    }

    const parent = [...ancestors]
      .reverse()
      .find((candidate) => candidate.overrides[key] !== undefined);
    const parentValue = parent?.overrides[key];
    if (parent && parentValue !== undefined) {
      resolved[key] = {
        value: parentValue,
        source: "parent",
        sourceEntryId: parent.id,
      };
    }

    resolved[key] ??= { value: defaults[key], source: "anatomy" };
  }

  return resolved;
};
