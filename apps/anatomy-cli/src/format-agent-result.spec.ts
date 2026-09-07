import { describe, expect, it } from "vitest";
import { AnatomyDraftInputSchema } from "@anatomy-cli/schemas";
import { queryAnatomy } from "@anatomy-cli/anatomy/core";
import { formatAgentQuery } from "./format-agent-result";

const definition = AnatomyDraftInputSchema.parse({
  name: "Readable query", purpose: "Show constraints before editing",
  structure: {
    schemaVersion: 1,
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
    bindings: { Name: { format: "PascalCase" } },
    root: { children: [{
      kind: "directory", name: { type: "placeholder", value: "<Name>Service" }, quantity: "one_or_more",
      children: [{
        kind: "one_of", minimumMatches: 1, maximumMatches: 1,
        alternatives: ["ts", "js"].map((extension) => ({
          kind: "file", name: { type: "placeholder", value: `<Name>Service.${extension}` }, quantity: "exactly_one",
          policyOverrides: { missingRequired: "warn" },
        })),
      }],
    }] },
  },
});

describe("human query output", () => {
  it("explains a file's export requirement with the resolved name", () => {
    const input = AnatomyDraftInputSchema.parse({
      ...definition, structure: { ...definition.structure, root: { children: [{
        kind: "file", name: { type: "placeholder", value: "<Method>.ts" }, quantity: "one_or_more", exports: { name: "file_stem" },
      }] } },
    });
    const query = queryAnatomy(input, "getUser.ts")._unsafeUnwrap();
    const text = formatAgentQuery(query, input, "anatomy.json", ".", "human");
    expect(text).toContain('Export: exactly one named function "getUser" (BLOCK)');
    expect(text).toContain("type exports do not count; default exports are not allowed");
  });
  it("explains inherited names, optional alternatives and policy overrides without a JSON dump", () => {
    const query = queryAnatomy(definition, "UserService")._unsafeUnwrap();
    const text = formatAgentQuery(query, definition, "anatomy.json", ".", "human");
    expect(text).toContain("directory UserService — required, one or more");
    expect(text).toContain("Choose 1-1 alternatives (requirements below apply when selected)");
    expect(text).toContain("file UserService.ts — required exactly once");
    expect(text).toContain("Missing entries: WARN");
    expect(text).toContain("Captured <Name> = User");
    expect(text).toContain("Binding <Name>: PascalCase");
    expect(text).toContain("Query only.");
    expect(text).not.toContain('"contractVersion"');
  });

  it("keeps unresolved paths visibly different from validation passes", () => {
    const query = queryAnatomy(definition, "extra/child")._unsafeUnwrap();
    const text = formatAgentQuery(query, definition, "anatomy.json", ".", "human");
    expect(text).toContain("UNMATCHED");
    expect(text).toContain(query.reason);
    expect(text).toContain("Extra entries: BLOCK");
    expect(text).not.toContain("PASS");
  });

  it("preserves the machine-readable response and metadata", () => {
    const query = queryAnatomy(definition, "UserService/UserService.ts")._unsafeUnwrap();
    const report = JSON.parse(formatAgentQuery(query, definition, "anatomy.json", ".", "json"));
    expect(report).toMatchObject(query);
    expect(report.definition).toMatchObject({ name: definition.name, schemaVersion: 1 });
  });
});
