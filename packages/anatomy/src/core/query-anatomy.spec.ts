import { AnatomyDraftInputSchema, AnatomyQueryWithConstraintsSchema } from "@anatomy-cli/schemas";
import { describe, expect, it } from "vitest";
import { checkAnatomy } from "./check-anatomy";
import { queryAnatomy } from "./query-anatomy";
import { anatomyRulePaths } from "./anatomy-rule-paths";

const serviceDefinition = () => AnatomyDraftInputSchema.parse({
  name: "Services", purpose: "Agent workflow",
  structure: {
    schemaVersion: 1,
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "warn", nameMismatch: "block", nestingMismatch: "block" },
    bindings: { Name: { format: "PascalCase", pattern: "[A-Z][a-z]+" } },
    root: { children: [{
      kind: "directory", name: { type: "placeholder", value: "<Name>Service" },
      quantity: "one_or_more", policyOverrides: { unexpectedEntry: "block" },
      children: [{
        kind: "one_of", minimumMatches: 1, maximumMatches: 1,
        alternatives: ["ts", "js"].map((extension) => ({
          kind: "file", name: { type: "placeholder", value: `<Name>Service.${extension}` }, quantity: "exactly_one",
        })),
      }],
    }] },
  },
});

describe("queryAnatomy", () => {
  it("describes the root and validates the public response schema", () => {
    const result = queryAnatomy(serviceDefinition(), ".")._unsafeUnwrap();
    expect(AnatomyQueryWithConstraintsSchema.safeParse(result).success).toBe(true);
    expect(result).toMatchObject({ status: "resolved", path: ".", captures: {} });
    expect(result.rules[0]?.node.kind).toBe("directory");
  });

  it("resolves a future file with inherited captures, policies and one-of constraints", () => {
    const definition = serviceDefinition();
    const result = queryAnatomy(definition, "./UserService/UserService.ts")._unsafeUnwrap();
    expect(result).toMatchObject({
      status: "resolved", captures: { Name: "User" }, policies: { unexpectedEntry: "block" },
      rules: [{ expectedName: "UserService.ts", rulePath: "/structure/root/children/0/children/0/alternatives/0" }],
      groups: [{ minimumMatches: 1, maximumMatches: 1 }],
      ancestors: [{ name: "UserService", quantity: "one_or_more" }],
    });
    const checked = checkAnatomy(definition, [{ kind: "directory", name: "UserService", children: [
      { kind: "file", name: "UserService.ts" },
    ] }])._unsafeUnwrap();
    expect(checked.conforms).toBe(true);
    expect(checked.issues).toEqual([]);
  });

  it.each([
    ["userService", "binding_format_mismatch"],
    ["User2Service", "binding_pattern_mismatch"],
    ["UserService/OrderService.ts", "binding_consistency_mismatch"],
  ])("reports the same naming failure as validation for %s", (path, reason) => {
    const definition = serviceDefinition();
    const query = queryAnatomy(definition, path)._unsafeUnwrap();
    expect(query).toMatchObject({ status: "mismatch", reason });
    const [directory, file] = path.split("/");
    const checked = checkAnatomy(definition, [{ kind: "directory", name: directory!, children:
      file ? [{ kind: "file", name: file }] : [],
    }])._unsafeUnwrap();
    expect(checked.issues.some((issue) => issue.code === reason)).toBe(true);
  });

  it("keeps sibling directory bindings independent", () => {
    const definition = serviceDefinition();
    expect(queryAnatomy(definition, "UserService/UserService.ts")._unsafeUnwrap().captures).toEqual({ Name: "User" });
    expect(queryAnatomy(definition, "OrderService/OrderService.js")._unsafeUnwrap().captures).toEqual({ Name: "Order" });
  });

  it("does not treat unmatched descendants as unconstrained success", () => {
    const result = queryAnatomy(serviceDefinition(), "UserService/extra/deep.ts")._unsafeUnwrap();
    expect(result).toMatchObject({ status: "unmatched", scopePath: "UserService", policies: { unexpectedEntry: "block" } });
    expect(result.reason).toContain("Descendants are not checked");
  });

  it("rejects descent through a declared file", () => {
    const result = queryAnatomy(serviceDefinition(), "UserService/UserService.ts/child")._unsafeUnwrap();
    expect(result).toMatchObject({ status: "mismatch", reason: "nesting_mismatch" });
  });

  it("exposes overlapping rules without guessing the consuming rule", () => {
    const definition = serviceDefinition();
    const original = definition.structure.root.children[0]!;
    definition.structure.root.children.push({ ...original, id: crypto.randomUUID(),
      ...(original.kind === "directory" ? { children: [] } : {}),
    });
    const query = queryAnatomy(definition, "UserService")._unsafeUnwrap();
    expect(query.status).toBe("ambiguous");
    expect(query.matches).toHaveLength(2);
  });

  it("provides stable rule pointers when parsing generates fresh IDs", () => {
    const left = serviceDefinition();
    const right = serviceDefinition();
    expect(left.structure.root.children[0]?.id).not.toBe(right.structure.root.children[0]?.id);
    expect(queryAnatomy(left, "UserService")._unsafeUnwrap().matches)
      .toEqual(queryAnatomy(right, "UserService")._unsafeUnwrap().matches);
    const registry = anatomyRulePaths(left);
    const issue = checkAnatomy(left, [])._unsafeUnwrap().issues[0]!;
    expect(registry.get(issue.constraintId!)?.rulePath).toBe("/structure/root/children/0");
  });

  it.each(["../outside", "a/../../b", "/etc", "C:\\code", "\\\\server\\share", "", "a\0b"])("rejects invalid path %j", (path) => {
    expect(queryAnatomy(serviceDefinition(), path).isErr()).toBe(true);
  });

  it("normalizes Windows relative paths", () => {
    expect(queryAnatomy(serviceDefinition(), "UserService\\UserService.ts")._unsafeUnwrap().status).toBe("resolved");
  });

  it("preserves angle brackets in literal names even with an inherited binding", () => {
    const definition = serviceDefinition();
    const directory = definition.structure.root.children[0]!;
    if (directory.kind !== "directory") throw new Error("Expected directory fixture");
    directory.children = [{
      id: crypto.randomUUID(), kind: "file", name: { type: "literal", value: "<Name>.txt" },
      quantity: "exactly_one", policyOverrides: {},
    }];
    expect(queryAnatomy(definition, "UserService/<Name>.txt")._unsafeUnwrap().rules[0]?.expectedName)
      .toBe("<Name>.txt");
  });

  it("returns invalid definitions as errors even for an unmatched path", () => {
    const definition = serviceDefinition();
    definition.structure.bindings = { Name: { pattern: "[" } };
    expect(queryAnatomy(definition, "unknown").isErr()).toBe(true);
  });

  it("does not claim a case-only match selects a one-of alternative", () => {
    const definition = serviceDefinition();
    const directory = definition.structure.root.children[0]!;
    if (directory.kind !== "directory") throw new Error("Expected directory fixture");
    const group = directory.children[0]!;
    if (group.kind !== "one_of") throw new Error("Expected one-of fixture");
    group.alternatives[0]!.name = { type: "literal", value: "index.ts" };
    const result = queryAnatomy(definition, "UserService/Index.ts")._unsafeUnwrap();
    expect(result.status).toBe("unmatched");
    expect(result.matches).toEqual([]);
    const checked = checkAnatomy(definition, [{ kind: "directory", name: "UserService", children: [
      { kind: "file", name: "Index.ts" },
    ] }])._unsafeUnwrap();
    expect(checked.issues.some((issue) => issue.code === "one_of_mismatch")).toBe(true);
  });
});
