import type { AnatomyStructure } from "@anatomy-cli/schemas";

export const createEmptyStructure = (): AnatomyStructure => {
  return {
    schemaVersion: 1,
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
