import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnatomyDraftInputSchema } from "@anatomy-cli/schemas";
import { checkAnatomy } from "@anatomy-cli/anatomy/core";
import { AnatomySkillFiles } from "./AnatomySkillFiles.js";
import { getSkillDestinations } from "./getSkillDestinations.js";
import { runSkillCommand } from "./runSkillCommand.js";

const root = resolve(import.meta.dirname, "../../..");
const skillRoot = join(root, "apps/anatomy-cli/skills/generate-anatomy");
let temporary: string;
beforeEach(() => {
  mkdirSync(join(root, "docs/skill-install"), { recursive: true });
  temporary = mkdtempSync(join(root, "docs/skill-install/test-"));
});
afterEach(() => rmSync(temporary, { recursive: true, force: true }));
const context = () => ({ home: join(temporary, "home with spaces"), cwd: join(temporary, "project"), runtimeUrl: pathToFileURL(join(root, "apps/anatomy-cli/src/runSkillCommand.ts")).href });

describe("agent skill destinations", () => {
  it("resolves all selected user roots and deduplicates repeated agents", () => {
    const ctx = context();
    expect(getSkillDestinations(["--agent", "codex,claude-code,pi,codex"], ctx.home, ctx.cwd)._unsafeUnwrap().destinations).toEqual([
      join(ctx.home, ".agents/skills/generate-anatomy"), join(ctx.home, ".claude/skills/generate-anatomy"), join(ctx.home, ".pi/agent/skills/generate-anatomy"),
    ]);
  });
  it("supports project roots and a custom skills directory", () => {
    const ctx = context();
    expect(getSkillDestinations(["--agent", "codex,claude-code,pi", "--scope", "project"], ctx.home, ctx.cwd)._unsafeUnwrap().destinations).toEqual([
      join(ctx.cwd, ".agents/skills/generate-anatomy"), join(ctx.cwd, ".claude/skills/generate-anatomy"), join(ctx.cwd, ".pi/skills/generate-anatomy"),
    ]);
    expect(getSkillDestinations(["--path", "custom"], ctx.home, ctx.cwd)._unsafeUnwrap().destinations).toEqual([join(ctx.cwd, "custom/generate-anatomy")]);
  });
  it.each([[], ["--agent"], ["--agent", "unknown"], ["--agent", "cc"], ["--scope", "invalid", "--agent", "codex"], ["--path", "x", "--agent", "pi"]])("rejects invalid options %j", (...args) => {
    expect(getSkillDestinations(args, temporary, temporary).isErr()).toBe(true);
  });
});

describe("skill resources", () => {
  it("copies complete resources to all selected roots and is idempotent", async () => {
    const ctx = context(), output = vi.fn(), args = ["install", "--agent", "codex,claude-code,pi"];
    expect((await runSkillCommand(args, output, ctx))._unsafeUnwrap()).toBe(0);
    for (const target of getSkillDestinations(args.slice(1), ctx.home, ctx.cwd)._unsafeUnwrap().destinations)
      for (const file of AnatomySkillFiles) expect(readFileSync(join(target, file), "utf8")).toBe(readFileSync(join(skillRoot, file), "utf8"));
    expect((await runSkillCommand(args, output, ctx))._unsafeUnwrap()).toBe(0);
    expect(output.mock.calls.some(([text]) => text.startsWith("Already installed:"))).toBe(true);
  });
  it("preflights conflicts before writing any agent folder", async () => {
    const ctx = context(), conflict = join(ctx.home, ".claude/skills/generate-anatomy");
    mkdirSync(conflict, { recursive: true });
    writeFileSync(join(conflict, "SKILL.md"), "existing skill");
    expect((await runSkillCommand(["install", "--agent", "codex,claude-code"], vi.fn(), ctx)).isErr()).toBe(true);
    expect(readFileSync(join(conflict, "SKILL.md"), "utf8")).toBe("existing skill");
    expect(existsSync(join(ctx.home, ".agents"))).toBe(false);
  });
  it("dry-runs without creating target folders", async () => {
    const ctx = context();
    expect((await runSkillCommand(["install", "--agent", "codex,claude-code,pi", "--dry-run"], vi.fn(), ctx)).isOk()).toBe(true);
    expect(existsSync(ctx.home)).toBe(false);
  });
  it("refuses a destination symlink", async () => {
    const base = join(temporary, "skills");
    mkdirSync(base);
    symlinkSync(skillRoot, join(base, "generate-anatomy"), "dir");
    expect((await runSkillCommand(["install", "--path", base], vi.fn(), context())).isErr()).toBe(true);
  });
  it("exports the actual schema without resources or model settings", async () => {
    const output = vi.fn();
    expect((await runSkillCommand(["schema"], output, { ...context(), runtimeUrl: "file:///missing/src/main.ts" })).isOk()).toBe(true);
    const schema = JSON.parse(output.mock.calls[0]![0]);
    expect(schema.properties.structure.properties.rootMode).toMatchObject({ const: "contents" });
  });
  it("validates the reusable example against the actual engine", () => {
    const definition = AnatomyDraftInputSchema.parse(JSON.parse(readFileSync(join(skillRoot, "references/example.anatomy.json"), "utf8")));
    const directory = (name: string) => ({ kind: "directory" as const, name: `${name}Service`, children: [{ kind: "file" as const, name: "index.ts" }, { kind: "file" as const, name: `${name}Service.ts` }] });
    expect(checkAnatomy(definition, [directory("User"), directory("Order")])._unsafeUnwrap().conforms).toBe(true);
    expect(checkAnatomy(definition, [{ ...directory("User"), children: [{ kind: "file", name: "Wrong.ts" }] }])._unsafeUnwrap().conforms).toBe(false);
  });
});
