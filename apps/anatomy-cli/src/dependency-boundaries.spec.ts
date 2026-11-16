import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAnatomyCli } from "./runAnatomyCli.js";

let temporary: string;
let target: string;
let configPath: string;
const boundaries = { rules: [{ name: "no-ui-data", from: ["ui/**"], to: ["data/**"], policy: "block" }], aliases: { "@/*": ["*"] } };
let definition: Record<string, unknown>;
const file = (value: string) => ({ kind: "file", name: { type: "literal", value }, quantity: "exactly_one" });
beforeEach(async () => {
  const root = resolve(import.meta.dirname, "../../../docs/dependency-boundaries");
  await mkdir(root, { recursive: true });
  temporary = await mkdtemp(join(root, "cli-"));
  target = join(temporary, "target");
  configPath = join(temporary, "anatomy.json");
  for (const dir of ["ui", "data"]) await mkdir(join(target, dir), { recursive: true });
  await writeFile(join(target, "ui/view.ts"), 'import "@/data/model.js";');
  await writeFile(join(target, "data/model.ts"), "export const model = 1;");
  definition = { name: "Boundary fixture", purpose: "CLI boundary checks", dependencies: boundaries, structure: {
    rootMode: "contents", defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
    root: { children: ["ui", "data"].map((value) => ({ kind: "directory", name: { type: "literal", value }, quantity: "exactly_one", children: [file(value === "ui" ? "view.ts" : "model.ts")] })) },
  } };
  await writeFile(configPath, JSON.stringify(definition));
});
afterEach(async () => { await rm(temporary, { recursive: true, force: true }); });
const check = async (flags: string[] = []) => {
  const output: string[] = [];
  const result = await runAnatomyCli([target, "--definition", configPath, ...flags], { writeOutput: (text) => output.push(text) });
  return { result, output: output.join("\n") };
};
describe("CLI dependency boundaries", () => {
  it("returns block exit 1 with rule pointer, location and target", async () => {
    const { result, output } = await check(["--format", "json"]);
    expect(result._unsafeUnwrap()).toBe(1);
    expect(JSON.parse(output)).toMatchObject({ conforms: false, issues: [{ code: "dependency_forbidden", rulePath: "/dependencies/rules/0", dependency: { specifier: "@/data/model.js", targetPath: "data/model.ts", line: 1 } }] });
  });
  it("prints actionable human diagnostics", async () => {
    const { result, output } = await check();
    expect(result._unsafeUnwrap()).toBe(1);
    expect(output).toContain("ui/view.ts:1:");
    expect(output).toContain("no-ui-data");
    expect(output).toContain("data/model.ts");
  });
  it("returns exit 0 for warnings and observes source-only edits", async () => {
    definition.dependencies = { ...boundaries, rules: boundaries.rules.map((r) => ({ ...r, policy: "warn" })) };
    await writeFile(configPath, JSON.stringify(definition));
    expect((await check()).result._unsafeUnwrap()).toBe(0);
    await writeFile(join(target, "ui/view.ts"), "export const view = 1;");
    const { output } = await check(["--format", "json"]);
    expect(JSON.parse(output)).toMatchObject({ conforms: true, summary: { block: 0, warn: 0 } });
  });
  it("propagates unresolved local source as an operational error without a pass report", async () => {
    await writeFile(join(target, "ui/view.ts"), 'import "../missing";');
    const { result, output } = await check();
    expect(result.isErr()).toBe(true);
    expect(output).toBe("");
  });
  it("checks the same boundaries through bundle CLI", async () => {
    const bundlePath = join(temporary, "bundle.json");
    await writeFile(bundlePath, JSON.stringify({ root: "fixture", definitions: [{ key: "fixture", definition }] }));
    const output: string[] = [];
    const result = await runAnatomyCli([target, "--bundle", bundlePath, "--format", "json"], { writeOutput: (s) => output.push(s) });
    expect(result._unsafeUnwrap()).toBe(1);
    expect(JSON.parse(output[0]!)).toMatchObject({ status: "completed", conforms: false, issues: [{ origin: { rulePath: "/dependencies/rules/0" } }] });
  });
});
