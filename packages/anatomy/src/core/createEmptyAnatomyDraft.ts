import type { AnatomyDraftInput } from "@anatomy-cli/schemas";

/** 使用标准默认策略创建可直接编辑的空白 Anatomy 草稿。 */
export const createEmptyAnatomyDraft = (name: string, purpose: string): AnatomyDraftInput => ({
  name,
  purpose,
  structure: {
    schemaVersion: 1,
    defaultPolicies: {
      missingRequired: "block",
      unexpectedEntry: "warn",
      nameMismatch: "warn",
      nestingMismatch: "block",
    },
    root: { children: [] },
  },
});
