import type { AnatomyPolicies, AnatomyPolicyOverrides } from "@anatomy-cli/schemas";
import type { ResolvedAnatomyPolicy } from "./ResolvedAnatomyPolicy";

/** Resolve policies in current-entry, nearest-parent, then Anatomy-default order. */
export const resolveAnatomyPolicies = (
  defaults: AnatomyPolicies,
  ancestors: Array<{
    /** Unique parent-entry identifier used to record the policy source. */
    id: string;
    /** Parent entry's local overrides of the default Anatomy policies. */
    overrides: AnatomyPolicyOverrides;
  }>,
  entry?: {
    /** Unique current-entry identifier used to record the policy source. */
    id: string;
    /** Current entry's local overrides of inherited policies. */
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
