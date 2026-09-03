import type { AnatomyPolicies } from "@anatomy-cli/schemas";

/** Effective value of a policy key and the level that supplied it. */
export type ResolvedAnatomyPolicy = {
  /** Policy value applied after resolution. */
  value: AnatomyPolicies[keyof AnatomyPolicies];
  /** Whether the policy came from the current entry, a parent, or Anatomy defaults. */
  source: "entry" | "parent" | "anatomy";
  /** Identifier of the entry that supplied the override, absent for defaults. */
  sourceEntryId?: string;
};
