import { AnatomyDraftInputSchema, type AnatomySourceExports } from "@anatomy-cli/schemas";
import { describe, expect, it } from "vitest";
import { checkAnatomy } from "./checkAnatomy.js";
import { planAnatomyCheck } from "./planAnatomyCheck.js";
import { queryAnatomy } from "./queryAnatomy.js";

const definition = () => AnatomyDraftInputSchema.parse({
  name: "Function files", purpose: "One named function per file",
  structure: {
    rootMode: "contents",
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
    root: { children: [{
      kind: "file", name: { type: "placeholder", value: "<Method>.ts" }, quantity: "one_or_more",
      exports: { name: "file_stem" },
    }] },
  },
});
const entries = [{ kind: "file" as const, name: "getUser.ts" }];
const inspect = (exports: AnatomySourceExports) => checkAnatomy(definition(), entries, new Map([["getUser.ts", exports]]))._unsafeUnwrap();

describe("function export contracts", () => {
  it("accepts exactly one correctly named function", () => {
    expect(inspect([{ name: "getUser", kind: "function" }])).toMatchObject({ conforms: true, issues: [] });
  });
  it.each([
    { exports: [], code: "export_count_mismatch" },
    { exports: [{ name: "getOrder", kind: "function" }], code: "export_name_mismatch" },
    { exports: [{ name: "default", kind: "function" }], code: "export_name_mismatch" },
    { exports: [{ name: "getUser", kind: "value" }], code: "export_kind_mismatch" },
    { exports: [{ name: "getUser", kind: "function" }, { name: "other", kind: "function" }], code: "export_count_mismatch" },
  ] satisfies { exports: AnatomySourceExports; code: string }[])("blocks $code", ({ exports, code }) => {
    const result = inspect(exports);
    expect(result.conforms).toBe(false);
    expect(result.issues).toEqual([expect.objectContaining({ code, path: "getUser.ts", expectedExport: "getUser", actualExports: exports })]);
  });
  it("fails closed when a caller skips source analysis", () => {
    expect(checkAnatomy(definition(), entries)._unsafeUnwrapErr()).toMatchObject({ name: "AnatomySourceAnalysisError", path: "getUser.ts" });
  });
  it("does not read source for unmatched files or absent optional entries", () => {
    const input = definition();
    expect(planAnatomyCheck(input, [{ kind: "file", name: "readme.md" }])._unsafeUnwrap().exportChecks).toEqual([]);
    expect(checkAnatomy(input, [])._unsafeUnwrap().issues[0]?.code).toBe("missing_required");
  });
  it("resolves a captured method name without including the suffix", () => {
    const input = definition();
    const file = input.structure.root.children[0]!;
    if (file.kind !== "file") throw new Error("Expected file fixture");
    file.name.value = "<Method>.method.ts";
    file.exports = { name: { type: "placeholder", value: "<Method>" }, policy: "block" };
    const plan = planAnatomyCheck(input, [{ kind: "file", name: "getUser.method.ts" }])._unsafeUnwrap();
    expect(plan.exportChecks[0]?.expectedName).toBe("getUser");
    expect(queryAnatomy(input, "getUser.method.ts")._unsafeUnwrap().rules[0]?.node).toMatchObject({ exports: file.exports });
  });
  it("rejects export placeholders that are not bound by the file path", () => {
    const input = definition();
    const file = input.structure.root.children[0]!;
    if (file.kind !== "file") throw new Error("Expected file fixture");
    file.exports = { name: { type: "placeholder", value: "<Unbound>" }, policy: "block" };
    expect(queryAnatomy(input, "getUser.ts").isErr()).toBe(true);
    expect(planAnatomyCheck(input, entries).isErr()).toBe(true);
  });
  it("inherits export names from directories and keeps repeated scopes independent", () => {
    const input = definition();
    const original = input.structure.root.children[0]!;
    input.structure.root.children = [{
      id: crypto.randomUUID(), kind: "directory", name: { type: "placeholder", value: "<Method>" },
      quantity: "one_or_more", policyOverrides: {}, children: [{
        ...original, kind: "file", name: { type: "literal", value: "index.ts" },
        quantity: "exactly_one", policyOverrides: {},
        exports: { name: { type: "placeholder", value: "<Method>" }, policy: "block" },
      }],
    }];
    const tree = ["getUser", "getOrder"].map((name) => ({
      kind: "directory" as const, name, children: [{ kind: "file" as const, name: "index.ts" }],
    }));
    const plan = planAnatomyCheck(input, tree)._unsafeUnwrap();
    expect(plan.exportChecks.map((check) => check.expectedName)).toEqual(["getUser", "getOrder"]);
    expect(queryAnatomy(input, "getUser/index.ts")._unsafeUnwrap().rules[0]?.expectedExport).toBe("getUser");
  });
  it("plans only consumed alternatives when file patterns overlap", () => {
    const input = definition();
    const original = input.structure.root.children[0]!;
    input.structure.root.children = [{
      id: crypto.randomUUID(), kind: "one_of", minimumMatches: 1, maximumMatches: 1,
      alternatives: [{
        ...original, kind: "file", name: { type: "literal", value: "getUser.ts" },
        quantity: "exactly_one", policyOverrides: {}, exports: { name: "file_stem", policy: "block" },
      }, {
        ...original, id: crypto.randomUUID(), kind: "file", name: { type: "literal", value: "getOrder.ts" },
        quantity: "exactly_one", policyOverrides: {}, exports: { name: "file_stem", policy: "block" },
      }],
    }, { ...original, id: crypto.randomUUID() }];
    expect(planAnatomyCheck(input, entries)._unsafeUnwrap().exportChecks).toHaveLength(1);
  });
  it("keeps existing structural-only definitions working without source analysis", () => {
    const input = definition();
    const file = input.structure.root.children[0]!;
    if (file.kind === "file") delete file.exports;
    expect(checkAnatomy(input, entries)._unsafeUnwrap().conforms).toBe(true);
  });
});
