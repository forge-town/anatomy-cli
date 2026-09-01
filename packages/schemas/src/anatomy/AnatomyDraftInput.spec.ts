import { describe, expect, it } from "vitest";
import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

const defaultPolicies = {
  missingRequired: "block" as const,
  unexpectedEntry: "block" as const,
  nameMismatch: "block" as const,
  nestingMismatch: "block" as const,
};

describe("AnatomyDraftInputSchema", () => {
  it("generates node IDs and defaults policy overrides for concise JSON definitions", () => {
    const parsed = AnatomyDraftInputSchema.parse({
      name: "Example",
      purpose: "Show the smallest useful Anatomy JSON shape.",
      structure: {
        schemaVersion: 1,
        defaultPolicies,
        root: {
          children: [
            {
              kind: "file",
              name: { type: "literal", value: "index.ts" },
              quantity: "exactly_one",
            },
            {
              kind: "directory",
              name: { type: "literal", value: "src" },
              quantity: "exactly_one",
              children: [
                {
                  kind: "file",
                  name: { type: "placeholder", value: "<Module>.ts" },
                  quantity: "one_or_more",
                },
              ],
            },
          ],
        },
      },
    });

    const [file, directory] = parsed.structure.root.children;
    const child = directory?.kind === "directory" ? directory.children[0] : undefined;

    expect(file?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(directory?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(child?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(new Set([file?.id, directory?.id, child?.id]).size).toBe(3);
    expect(file && file.kind !== "one_of" ? file.policyOverrides : undefined).toEqual({});
    expect(directory && directory.kind !== "one_of" ? directory.policyOverrides : undefined).toEqual({});
    expect(child && child.kind !== "one_of" ? child.policyOverrides : undefined).toEqual({});
  });
});
