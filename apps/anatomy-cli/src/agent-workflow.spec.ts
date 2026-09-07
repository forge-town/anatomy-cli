import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AnatomyCheckWithDiagnosticsSchema, AnatomyQueryWithConstraintsSchema } from "@anatomy-cli/schemas";
import { runAnatomyCli, type AnatomyCliDependencies } from "./cli";
import { collectFileTree, findAnatomyDefinition, readAnatomyDefinition } from "./filesystem";
import { formatAgentError } from "./format-agent-result";

const verificationRoot = resolve(import.meta.dirname, "../../../docs/verification/agent-workflow-tests");
let directory: string;
const document = () => ({
  name: "Services", purpose: "Plan before creating modules",
  structure: {
    schemaVersion: 1,
    defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
    bindings: { Name: { format: "PascalCase" } },
    root: { children: [{
      kind: "directory", name: { type: "placeholder", value: "<Name>Service" }, quantity: "one_or_more",
      children: [{ kind: "file", name: { type: "placeholder", value: "<Name>Service.ts" }, quantity: "exactly_one" }],
    }] },
  },
});

beforeEach(async () => {
  await mkdir(verificationRoot, { recursive: true });
  directory = await mkdtemp(join(verificationRoot, "case-"));
  await writeFile(join(directory, "anatomy.json"), JSON.stringify(document()));
});

afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

const invoke = async (args: string[]) => {
  const output: string[] = [];
  const dependencies: AnatomyCliDependencies = {
    findDefinition: findAnatomyDefinition, readDefinition: async (path) => readAnatomyDefinition(path),
    collectTree: collectFileTree, writeOutput: (value) => output.push(value),
  };
  const result = await runAnatomyCli([directory, ...args, "--format", "json"], dependencies);
  return { result, output: output.join("\n") };
};

describe("Agent query-edit-check workflow", () => {
  it("queries a missing file, catches a wrong name, and validates a corrected module", async () => {
    const queried = await invoke(["--query", "UserService/UserService.ts"]);
    expect(queried.result._unsafeUnwrap()).toBe(0);
    const query = AnatomyQueryWithConstraintsSchema.parse(JSON.parse(queried.output));
    expect(query.status).toBe("resolved");
    expect(query.captures).toEqual({ Name: "User" });
    await mkdir(join(directory, "UserService"));
    await writeFile(join(directory, "UserService", "OrderService.ts"), "export const service = {};\n");
    const blocked = await invoke([]);
    expect(blocked.result._unsafeUnwrap()).toBe(1);
    const report = AnatomyCheckWithDiagnosticsSchema.parse(JSON.parse(blocked.output));
    expect(report.issues[0]).toMatchObject({
      code: "binding_consistency_mismatch", rulePath: query.matches[0],
      actual: [{ kind: "file", name: "OrderService.ts" }],
      expected: { name: { value: "<Name>Service.ts" } },
    });
    expect(report.definition.path).toBe(join(directory, "anatomy.json"));
    expect(report.targetPath).toBe(directory);
    expect(report.ignoredNames).toContain("node_modules");
    await rm(join(directory, "UserService", "OrderService.ts"));
    await writeFile(join(directory, "UserService", "UserService.ts"), "export const service = {};\n");
    const passed = await invoke([]);
    expect(passed.result._unsafeUnwrap()).toBe(0);
    expect(JSON.parse(passed.output)).toMatchObject({ conforms: true, issues: [] });
  });

  it("provides actual sibling entries for a missing required file", async () => {
    await mkdir(join(directory, "UserService"));
    await writeFile(join(directory, "UserService", "extra.txt"), "");
    const checked = await invoke([]);
    const report = AnatomyCheckWithDiagnosticsSchema.parse(JSON.parse(checked.output));
    expect(report.issues.find((issue) => issue.code === "missing_required")).toMatchObject({
      path: "UserService", actual: [{ kind: "file", name: "extra.txt" }],
      rulePath: "/structure/root/children/0/children/0",
    });
    expect(report.issues.find((issue) => issue.code === "unexpected_entry")).toMatchObject({
      path: "UserService/extra.txt", rulePath: null, expected: null,
    });
  });

  it.each([{ args: [] }, { args: ["--query", "unmatched"] }])("rejects unsupported constraints in both modes: $args", async ({ args }) => {
    const invalid = document();
    Object.assign(invalid.structure, { dependencyRules: [] });
    await writeFile(join(directory, "anatomy.json"), JSON.stringify(invalid));
    const run = await invoke(args);
    expect(run.result.isErr()).toBe(true);
    expect(run.output).toBe("");
    const error = JSON.parse(formatAgentError(run.result._unsafeUnwrapErr()));
    expect(error).toMatchObject({ operation: "error", error: { code: "AnatomyDefinitionFileError" } });
  });

  it("reports an unreadable definition as an operational error", async () => {
    const run = await invoke(["--definition", join(directory, "missing.json")]);
    expect(run.result.isErr()).toBe(true);
    expect(run.output).toBe("");
  });

  it("does not report success when the target cannot be read", async () => {
    const output: string[] = [];
    const result = await runAnatomyCli([join(directory, "missing"), "--query", ".",
      "--definition", join(directory, "anatomy.json"), "--format", "json"], {
      findDefinition: findAnatomyDefinition, readDefinition: async (path) => readAnatomyDefinition(path),
      collectTree: collectFileTree, writeOutput: (value) => output.push(value),
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe("AnatomyFileTreeError");
    expect(output).toEqual([]);
  });

  it("uses the same explicit root for discovery, querying and checking", async () => {
    const scope = join(directory, "scope");
    await mkdir(scope);
    const output: string[] = [];
    const result = await runAnatomyCli([scope, "--query", "UserService", "--format", "json"], {
      findDefinition: findAnatomyDefinition, readDefinition: async (path) => readAnatomyDefinition(path),
      collectTree: collectFileTree, writeOutput: (value) => output.push(value),
    });
    expect(result._unsafeUnwrap()).toBe(0);
    expect(JSON.parse(output[0]!)).toMatchObject({ targetPath: scope,
      definition: { path: join(directory, "anatomy.json") }, status: "resolved",
    });
  });
});
