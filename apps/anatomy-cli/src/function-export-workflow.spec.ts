import { AnatomyCheckWithDiagnosticsSchema } from "@anatomy-cli/schemas";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectSourceExports } from "./collectSourceExports";
import { collectFileTree } from "./collectFileTree";
import { findAnatomyDefinition } from "./findAnatomyDefinition";
import { readAnatomyDefinition } from "./readAnatomyDefinition";
import { runAnatomyCli } from "./runAnatomyCli";

const verificationRoot = resolve(import.meta.dirname, "../../../docs/verification/function-export-tests");
let directory: string;
const contract = () => ({
  name: "Function modules", purpose: "One function per file",
  structure: {
    schemaVersion: 1,
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
    root: { children: [{
      kind: "file", name: { type: "placeholder", value: "<Method>.ts" }, quantity: "one_or_more", exports: { name: "file_stem" },
    }] },
  },
});
beforeEach(async () => {
  await mkdir(verificationRoot, { recursive: true });
  directory = await mkdtemp(join(verificationRoot, "case-"));
  await writeFile(join(directory, "anatomy.json"), JSON.stringify(contract()));
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

const invoke = async (args: string[] = []) => {
  const output: string[] = [];
  const result = await runAnatomyCli([directory, "--format", "json", ...args], {
    findDefinition: findAnatomyDefinition,
    readDefinition: async (path) => readAnatomyDefinition(path),
    collectTree: collectFileTree,
    writeOutput: (value) => output.push(value),
  });
  return { result, output: output.join("\n") };
};

describe("function export CLI workflow", () => {
  it("queries, catches a wrong export, then passes after correcting source in place", async () => {
    const queried = await invoke(["--query", "getUser.ts"]);
    const query = JSON.parse(queried.output);
    expect(query.rules[0].expectedExport).toBe("getUser");
    await writeFile(join(directory, "getUser.ts"), "export function getOrder() {}\n");
    const blocked = await invoke();
    expect(blocked.result._unsafeUnwrap()).toBe(1);
    const report = AnatomyCheckWithDiagnosticsSchema.parse(JSON.parse(blocked.output));
    expect(report.issues[0]).toMatchObject({
      code: "export_name_mismatch", expectedExport: "getUser", rulePath: query.rules[0].rulePath,
      actualExports: [{ name: "getOrder", kind: "function" }],
    });
    await writeFile(join(directory, "getUser.ts"), "export type User = {}; export const getUser = () => ({});\n");
    const passed = await invoke();
    expect(passed.result._unsafeUnwrap()).toBe(0);
    expect(JSON.parse(passed.output)).toMatchObject({ conforms: true, issues: [] });
  });

  it.each([
    { source: "const getUser = () => {};", code: "export_count_mismatch" },
    { source: "export default function getUser() {}", code: "export_name_mismatch" },
    { source: "export const getUser = 1;", code: "export_kind_mismatch" },
    { source: "export function getUser() {} export const version = 1;", code: "export_count_mismatch" },
    { source: "export type getUser = {};", code: "export_count_mismatch" },
  ])("blocks $code from real source", async ({ source, code }) => {
    await writeFile(join(directory, "getUser.ts"), source);
    const run = await invoke();
    expect(run.result._unsafeUnwrap()).toBe(1);
    expect(JSON.parse(run.output).issues[0].code).toBe(code);
  });

  it.each(["export function ( {", "export * from './other';"])("reports unsupported analysis as an operational error: %s", async (source) => {
    await writeFile(join(directory, "getUser.ts"), source);
    const run = await invoke();
    expect(run.result._unsafeUnwrapErr()).toMatchObject({ name: "AnatomySourceAnalysisError" });
    expect(run.output).toBe("");
  });

  it("does not parse source in query mode", async () => {
    await writeFile(join(directory, "getUser.ts"), "export function ( {");
    const run = await invoke(["--query", "getUser.ts"]);
    expect(run.result._unsafeUnwrap()).toBe(0);
    expect(JSON.parse(run.output).status).toBe("resolved");
  });

  it("fails explicitly when a selected source file cannot be read", async () => {
    const result = await collectSourceExports(directory, [{ path: "missing.ts", expectedName: "missing", policy: "block", constraintId: "missing" }]);
    expect(result.isErr()).toBe(true);
  });

  it("leaves source analysis opt-in for existing definitions", async () => {
    const document = contract();
    Reflect.deleteProperty(document.structure.root.children[0]!, "exports");
    await writeFile(join(directory, "anatomy.json"), JSON.stringify(document));
    await writeFile(join(directory, "getUser.ts"), "not valid JavaScript: {{{");
    const run = await invoke();
    expect(run.result._unsafeUnwrap()).toBe(0);
  });
});
