import { type AnatomyDraftInput } from "@anatomy-cli/schemas";
import { createEmptyAnatomyDraft } from "./createEmptyAnatomyDraft";
import { describe, expect, it } from "vitest";
import { AnatomyCheckCode, checkAnatomy, type AnatomyFileTreeEntry } from "./check-anatomy";

const file = (id: string, name: string, quantity = "exactly_one" as const) => {
  return {
    id,
    kind: "file" as const,
    name: { type: "literal" as const, value: name },
    quantity,
    policyOverrides: {},
  };
};

const definition = (
  children: AnatomyDraftInput["structure"]["root"]["children"],
): AnatomyDraftInput => {
  const draft = createEmptyAnatomyDraft("Component", "Component structure");

  return { ...draft, structure: { ...draft.structure, root: { children } } };
};

const standaloneDialogDefinition = (() => {
  const input = definition([
    {
      id: "00000000-0000-4000-8100-000000000001",
      kind: "directory",
      name: { type: "placeholder", value: "<DialogName>Dialog" },
      quantity: "exactly_one",
      policyOverrides: {},
      children: [
        {
          ...file("00000000-0000-4000-8100-000000000002", "<DialogName>Dialog.tsx"),
          name: {
            type: "placeholder",
            value: "<DialogName>Dialog.tsx",
          },
        },
        {
          ...file("00000000-0000-4000-8100-000000000003", "<DialogName>Dialog.spec.tsx"),
          name: {
            type: "placeholder",
            value: "<DialogName>Dialog.spec.tsx",
          },
        },
        {
          ...file("00000000-0000-4000-8100-000000000004", "<DialogName>Dialog.stories.tsx"),
          name: {
            type: "placeholder",
            value: "<DialogName>Dialog.stories.tsx",
          },
        },
        file("00000000-0000-4000-8100-000000000005", "index.ts"),
      ],
    },
  ]);

  return {
    ...input,
    name: "React Dialog Component Unit",
    purpose: "Defines a standalone Dialog component directory.",
    structure: {
      ...input.structure,
      defaultPolicies: {
        missingRequired: "block",
        unexpectedEntry: "allow",
        nameMismatch: "warn",
        nestingMismatch: "block",
      },
    },
  } satisfies AnatomyDraftInput;
})();

const completeDialogFiles = [
  { kind: "file" as const, name: "CreateCrateDialog.tsx" },
  { kind: "file" as const, name: "CreateCrateDialog.spec.tsx" },
  { kind: "file" as const, name: "CreateCrateDialog.stories.tsx" },
  { kind: "file" as const, name: "index.ts" },
];

const createDialogTree = (children: AnatomyFileTreeEntry[]): AnatomyFileTreeEntry[] => [
  { kind: "directory", name: "CreateCrateDialog", children },
];

describe("checkAnatomy", () => {
  it("accepts a matching nested structure", () => {
    const input = definition([
      {
        id: "00000000-0000-4000-8000-000000000001",
        kind: "directory",
        name: { type: "literal", value: "src" },
        quantity: "exactly_one",
        policyOverrides: {},
        children: [file("00000000-0000-4000-8000-000000000002", "index.ts")],
      },
    ]);

    const result = checkAnatomy(input, [
      {
        kind: "directory",
        name: "src",
        children: [{ kind: "file", name: "index.ts" }],
      },
    ])._unsafeUnwrap();

    expect(result).toEqual({
      issues: [],
      summary: { block: 0, warn: 0, allow: 0 },
      conforms: true,
    });
  });

  it("blocks a missing required entry and warns for an unexpected entry", () => {
    const result = checkAnatomy(
      definition([file("00000000-0000-4000-8000-000000000003", "index.ts")]),
      [{ kind: "file", name: "README.md" }],
    )._unsafeUnwrap();

    expect(result.conforms).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: AnatomyCheckCode.missingRequired,
          severity: "block",
        }),
        expect.objectContaining({
          code: AnatomyCheckCode.unexpectedEntry,
          severity: "warn",
        }),
      ]),
    );
  });

  it("matches placeholder suffixes and repeatable quantities", () => {
    const placeholder = {
      ...file("00000000-0000-4000-8000-000000000004", "unused"),
      name: { type: "placeholder" as const, value: "<Name>.tsx" },
      quantity: "one_or_more" as const,
    };
    const result = checkAnatomy(definition([placeholder]), [
      { kind: "file", name: "Button.tsx" },
      { kind: "file", name: "Input.tsx" },
    ])._unsafeUnwrap();

    expect(result.conforms).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("matches placeholders surrounded by a fixed prefix and suffix", () => {
    const placeholder = {
      ...file("00000000-0000-4000-8000-000000000024", "unused"),
      name: { type: "placeholder" as const, value: "use<Feature>.spec.ts" },
    };
    const result = checkAnatomy(definition([placeholder]), [
      { kind: "file", name: "useAnatomyScan.spec.ts" },
    ])._unsafeUnwrap();

    expect(result.conforms).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("does not let a base extension placeholder consume a mismatched story suffix", () => {
    const componentFile = {
      ...file("00000000-0000-4000-8000-000000000025", "unused"),
      name: { type: "placeholder" as const, value: "<Name>.tsx" },
    };
    const specificationFile = {
      ...file("00000000-0000-4000-8000-000000000026", "unused"),
      name: { type: "placeholder" as const, value: "<Name>.spec.tsx" },
    };
    const result = checkAnatomy(definition([componentFile, specificationFile]), [
      { kind: "file", name: "Button.tsx" },
      { kind: "file", name: "Button.stories.tsx" },
    ])._unsafeUnwrap();

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: AnatomyCheckCode.missingRequired,
          constraintId: specificationFile.id,
        }),
        expect.objectContaining({
          code: AnatomyCheckCode.unexpectedEntry,
          path: "Button.stories.tsx",
        }),
      ]),
    );
    expect(result.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: AnatomyCheckCode.quantityExceeded }),
      ]),
    );
  });

  it("reports a case-only name mismatch with the configured policy", () => {
    const expected = {
      ...file("00000000-0000-4000-8000-000000000005", "index.ts"),
      policyOverrides: { nameMismatch: "block" as const },
    };
    const result = checkAnatomy(definition([expected]), [
      { kind: "file", name: "Index.ts" },
    ])._unsafeUnwrap();

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: AnatomyCheckCode.nameMismatch,
        severity: "block",
      }),
    ]);
  });

  it("enforces one-of match ranges", () => {
    const result = checkAnatomy(
      definition([
        {
          id: "00000000-0000-4000-8000-000000000006",
          kind: "one_of",
          minimumMatches: 1,
          maximumMatches: 1,
          alternatives: [
            file("00000000-0000-4000-8000-000000000007", "index.ts"),
            file("00000000-0000-4000-8000-000000000008", "index.tsx"),
          ],
        },
      ]),
      [
        { kind: "file", name: "index.ts" },
        { kind: "file", name: "index.tsx" },
      ],
    )._unsafeUnwrap();

    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: AnatomyCheckCode.oneOfMismatch })]),
    );
  });
});

describe("standalone Dialog anatomy", () => {
  it("accepts a complete standalone Dialog component unit", () => {
    const result = checkAnatomy(
      standaloneDialogDefinition,
      createDialogTree(completeDialogFiles),
    )._unsafeUnwrap();

    expect(result.conforms).toBe(true);
    expect(result.summary.block).toBe(0);
  });

  it("blocks every missing required Dialog unit file", () => {
    for (const missing of completeDialogFiles) {
      const result = checkAnatomy(
        standaloneDialogDefinition,
        createDialogTree(completeDialogFiles.filter((entry) => entry.name !== missing.name)),
      )._unsafeUnwrap();

      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: AnatomyCheckCode.missingRequired,
            severity: "block",
          }),
        ]),
      );
    }
  });

  it("blocks a Dialog component file at the wrong nesting level", () => {
    const result = checkAnatomy(standaloneDialogDefinition, [
      ...createDialogTree(completeDialogFiles.slice(1)),
      { kind: "file", name: "CreateCrateDialog.tsx" },
    ])._unsafeUnwrap();

    expect(result.summary.block).toBeGreaterThan(0);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: AnatomyCheckCode.missingRequired,
          severity: "block",
        }),
      ]),
    );
  });

  it("allows optional form, hook, and helper files", () => {
    const result = checkAnatomy(
      standaloneDialogDefinition,
      createDialogTree([
        ...completeDialogFiles,
        { kind: "file", name: "useCreateCrateDialogState.ts" },
        { kind: "file", name: "CreateCrateDialogForm.tsx" },
        { kind: "file", name: "createCrateDialogValues.ts" },
      ]),
    )._unsafeUnwrap();

    expect(result.conforms).toBe(true);
    expect(result.summary.block).toBe(0);
    expect(result.summary.allow).toBe(3);
  });
});
