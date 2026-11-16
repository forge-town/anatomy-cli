import { describe, expect, it } from "vitest";
import { AnatomyDependencyConfigSchema, AnatomyScanOutcomeSchema } from "@anatomy-cli/schemas";
import { checkAnatomyDependencies } from "./checkAnatomyDependencies.js";
import { matchesDependencyPath } from "../core/matchesDependencyPath.js";
import { scanAnatomy } from "../composition/scanAnatomy.js";

const config = AnatomyDependencyConfigSchema.parse({ rules: [{ name: "no-ui-data", from: ["ui/**"], to: ["data/**"] }], aliases: { "@/*": ["*"] } });
const run = (content: string, extra: Record<string, string> = {}) => checkAnatomyDependencies({ config, files: ["ui/view.ts", "data/model.ts", "data/index.ts", ...Object.keys(extra)], sources: { "ui/view.ts": content, ...extra } });
const policies = { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" };
const file = (name: string) => ({ kind: "file", name: { type: "literal", value: name }, quantity: "exactly_one" });
const directory = (name: string, children: unknown[]) => ({ kind: "directory", name: { type: "literal", value: name }, quantity: "exactly_one", children });
const definition = (children: unknown[], dependencies?: unknown) => ({ name: "Example", purpose: "Boundary fixture", structure: { rootMode: "contents", defaultPolicies: policies, root: { children } }, ...(dependencies ? { dependencies } : {}) });

describe("dependency boundary configuration", () => {
  it("validates unique rule names, glob grammar and alias substitution", () => {
    expect(AnatomyDependencyConfigSchema.safeParse({ rules: [...config.rules, ...config.rules] }).success).toBe(false);
    for (const pattern of ["../data/**", "/data/**", "data/**x", "data/[ab]", "data//file"]) expect(AnatomyDependencyConfigSchema.safeParse({ rules: [{ ...config.rules[0], from: [pattern] }] }).success).toBe(false);
    expect(AnatomyDependencyConfigSchema.safeParse({ rules: config.rules, aliases: { "@data": ["data/*"] } }).success).toBe(false);
  });
  it("anchors globs and supports zero or multiple ** segments", () => {
    for (const path of ["file.ts", "a/file.ts", "a/b/file.ts"]) expect(matchesDependencyPath(path, ["**/*.ts"])).toBe(true);
    expect(matchesDependencyPath("a/b/file.ts", ["a/*.ts"])).toBe(false);
    expect(matchesDependencyPath("a/fileXts", ["a/*.ts"])).toBe(false);
  });
});

describe("direct dependency analysis", () => {
  it.each([
    'import { model } from "../data/model.js";',
    'import "../data/model";',
    'export * from "../data/model.js";',
    'export type { Model } from "../data/model.js";',
    'import type { Model } from "@/data/model";',
    'type Model = import("../data/model.js").Model;',
    'const load = () => import("../data/model.js");',
    'import Model = require("../data/model");',
  ])("finds a forbidden edge in %s", async (content) => {
    const result = (await run(content))._unsafeUnwrap();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ code: "dependency_forbidden", severity: "block", path: "ui/view.ts", targetPath: "data/model.ts", line: 1, ruleName: "no-ui-data" });
    expect(result[0]!.column).toBeGreaterThan(0);
  });
  it("resolves directory indices and aliases by exact/longest prefix with fallback", async () => {
    expect((await run('import "../data";'))._unsafeUnwrap()[0]!.targetPath).toBe("data/index.ts");
    const selected = { ...config, aliases: { "@/*": ["missing/*"], "@/private/*": ["missing/*", "data/*"], "@/private/model": ["data/model.ts"] } };
    expect((await checkAnatomyDependencies({ config: selected, files: ["ui/view.ts", "data/model.ts"], sources: { "ui/view.ts": 'import "@/private/model";' } }))._unsafeUnwrap()).toHaveLength(1);
  });
  it.each([".", "./"])("resolves the current directory index for %s", async (specifier) => {
    expect((await run(`import "${specifier}";`, { "ui/index.ts": "export const x = 1;" }))._unsafeUnwrap()).toEqual([]);
  });
  it("resolves directory imports ending with a slash", async () => {
    expect((await run('import "../data/";'))._unsafeUnwrap()[0]!.targetPath).toBe("data/index.ts");
  });
  it("counts repeated edges with distinct source locations, and all matching policies", async () => {
    const result = await checkAnatomyDependencies({ config: { ...config, rules: [...config.rules, { ...config.rules[0], name: "warning", policy: "warn" }] }, files: ["ui/view.ts", "data/model.ts"], sources: { "ui/view.ts": 'import "../data/model";\nexport * from "../data/model";' } });
    expect(result._unsafeUnwrap()).toHaveLength(4);
    expect(result._unsafeUnwrap().map((i) => i.line)).toEqual([1, 1, 2, 2]);
  });
  it("ignores comments, string content, unmapped external imports and unselected sources", async () => {
    expect((await run('// import "../data/model";\nconst text = "../data/model"; import type { X } from "external";'))._unsafeUnwrap()).toEqual([]);
    expect((await checkAnatomyDependencies({ config, files: ["outside.ts"], sources: {} }))._unsafeUnwrap()).toEqual([]);
  });
  it.each(['import "../missing";', 'import "@/missing";', 'import "/etc/passwd";', 'import "../../outside";', 'const x = import(variable);', 'const x = require("../data/model");', 'const = ;'])('fails explicitly for unavailable, unsupported or invalid input: %s', async (content) => {
    expect((await run(content)).isErr()).toBe(true);
  });
  it("rejects root escapes even when a same-named file exists inside the inventory", async () => {
    for (const specifier of ["../../outside", "@/../outside", "file:///outside.ts", "C:/outside.ts"]) {
      expect((await run(`import "${specifier}";`, { "outside.ts": "export const x = 1;" })).isErr()).toBe(true);
    }
  });
  it("requires source coverage, safe paths and source byte limits", async () => {
    expect((await checkAnatomyDependencies({ config, files: ["ui/view.ts"], sources: {} })).isErr()).toBe(true);
    expect((await checkAnatomyDependencies({ config, files: ["../outside.ts"], sources: {} })).isErr()).toBe(true);
    expect((await run("x".repeat(5_000_001))).isErr()).toBe(true);
  });
  it("does not follow transitive edges or read their source", async () => {
    expect((await run('import "./helper";', { "ui/helper.ts": 'export * from "external";' }))._unsafeUnwrap()).toEqual([]);
  });
});

describe("full SDK scans", () => {
  const children = [directory("ui", [file("view.ts")]), directory("data", [file("model.ts")])];
  const target = { name: "example", kind: "directory", children: [{ name: "ui", kind: "directory", children: [{ kind: "file", name: "view.ts" }] }, { name: "data", kind: "directory", children: [{ kind: "file", name: "model.ts" }] }] };
  it("combines structure and dependency findings with provenance", async () => {
    const result = await scanAnatomy({ bundle: { root: "example", definitions: [{ key: "example", definition: definition(children, config) }] }, target, coverage: { status: "complete" }, sources: { "ui/view.ts": 'import "../data/model.js";' } });
    AnatomyScanOutcomeSchema.parse(result);
    expect(result).toMatchObject({ status: "completed", conforms: false, summary: { block: 1 }, issues: [{ origin: { definitionKey: "example", rulePath: "/dependencies/rules/0" }, dependency: { targetPath: "data/model.ts" } }] });
  });
  it("keeps warning-only scans conforming", async () => {
    const warning = { ...config, rules: config.rules.map((rule) => ({ ...rule, policy: "warn" })) };
    const result = await scanAnatomy({ bundle: { root: "example", definitions: [{ key: "example", definition: definition(children, warning) }] }, target, coverage: { status: "complete" }, sources: { "ui/view.ts": 'import "../data/model.js";' } });
    expect(result).toMatchObject({ status: "completed", conforms: true, summary: { warn: 1, block: 0 } });
  });
  it("returns an operational error for missing source instead of partial findings", async () => {
    const result = await scanAnatomy({ bundle: { root: "example", definitions: [{ key: "example", definition: definition(children, config) }] }, target, coverage: { status: "complete" } });
    expect(result).toMatchObject({ status: "error", conforms: null, diagnostics: [{ code: "source_analysis_error" }] });
    expect(result).not.toHaveProperty("summary");
  });
  it("scopes mounted definitions and preserves mount provenance", async () => {
    const bundle = { root: "root", definitions: [{ key: "root", definition: definition([{ kind: "composition", ref: "example", name: { type: "literal", value: "feature" }, quantity: "exactly_one" }]) }, { key: "example", definition: definition(children, config) }] };
    const result = await scanAnatomy({ bundle, target: { name: "root", kind: "directory", children: [{ ...target, name: "feature" }] }, coverage: { status: "complete" }, sources: { "feature/ui/view.ts": 'import "@/data/model";' } });
    expect(result).toMatchObject({ status: "completed", conforms: false, issues: [{ entryPath: "feature/ui/view.ts", scopePath: "feature", mounts: [{ ref: "example", mountPath: "feature" }], dependency: { targetPath: "feature/data/model.ts" } }] });
  });
});
