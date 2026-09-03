import type { AnatomyDraftInput } from "@anatomy-cli/schemas";

/** Create an editable blank Anatomy draft with the standard default policies. */
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
    bindings: {},
    root: { children: [] },
  },
});
