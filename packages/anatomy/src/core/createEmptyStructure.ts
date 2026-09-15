import type { AnatomyStructure } from "@anatomy-cli/schemas";

export const createEmptyStructure = (): AnatomyStructure => {
  return {
    rootMode: "contents",
    defaultPolicies: {
      missingRequired: "block",
      unexpectedEntry: "warn",
      nameMismatch: "warn",
      nestingMismatch: "block",
    },
    bindings: {},
    root: { children: [] },
  };
};
