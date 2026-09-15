import { describe, expect, it } from "vitest";
import { AnatomyDraftInputSchema } from "./AnatomyDraftInputSchema.js";

const definition = () => ({
  name: "Contract", purpose: "Reject unsupported rules",
  structure: {
    rootMode: "contents",
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "warn", nameMismatch: "warn", nestingMismatch: "block" },
    root: { children: [{ kind: "file", name: { type: "literal", value: "index.ts" }, quantity: "exactly_one" }] },
  },
});

describe("Anatomy definition contract", () => {
  it("allows an explicit function export rule only on files", () => {
    const input = definition();
    Object.assign(input.structure.root.children[0]!, { exports: { name: "file_stem" } });
    const parsed = AnatomyDraftInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.structure.root.children[0]).toMatchObject({ exports: { policy: "block" } });
    Object.assign(input.structure.root.children[0]!, { kind: "directory", children: [] });
    expect(AnatomyDraftInputSchema.safeParse(input).success).toBe(false);
  });
  it("rejects unsupported export options", () => {
    const input = definition();
    Object.assign(input.structure.root.children[0]!, { exports: { name: "file_stem", allowDefault: true } });
    expect(AnatomyDraftInputSchema.safeParse(input).success).toBe(false);
  });
  it("accepts the current format with omitted IDs and overrides", () => {
    expect(AnatomyDraftInputSchema.safeParse(definition()).success).toBe(true);
  });
  it("rejects unknown root modes and node kinds", () => {
    const input = definition();
    input.structure.rootMode = "unknown";
    expect(AnatomyDraftInputSchema.safeParse(input).success).toBe(false);
    input.structure.rootMode = "contents";
    input.structure.root.children[0]!.kind = "dependency";
    expect(AnatomyDraftInputSchema.safeParse(input).success).toBe(false);
  });
  it.each(["structure", "root", "node", "name", "policies", "overrides", "binding"])("rejects unknown %s rules instead of silently stripping them", (location) => {
    const input = definition();
    const node = input.structure.root.children[0]!;
    const target = location === "structure" ? input.structure
      : location === "root" ? input.structure.root
      : location === "node" ? node
      : location === "name" ? node.name
      : location === "policies" ? input.structure.defaultPolicies : null;
    if (target) Object.assign(target, { unsupportedRule: true });
    if (location === "overrides") Object.assign(node, { policyOverrides: { unsupportedRule: "block" } });
    if (location === "binding") Object.assign(input.structure, { bindings: { Name: { format: "PascalCase", unsupportedRule: true } } });
    expect(AnatomyDraftInputSchema.safeParse(input).success).toBe(false);
  });
});
