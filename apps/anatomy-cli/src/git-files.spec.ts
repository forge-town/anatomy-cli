import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectGitFileTree } from "./collectGitFileTree.js";
import { parseCliArguments } from "./parseCliArguments.js";
import { runAnatomyCli } from "./runAnatomyCli.js";

const temporaryDirectories: string[] = [];
const fixture = async () => {
  const base = resolve(import.meta.dirname, "../../../docs/verification");
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(`${base}/git-files-`);
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "--quiet", directory]);
  await writeFile(resolve(directory, ".gitignore"), "local/\nnode_modules/\n");
  await mkdir(resolve(directory, "local"));
  await writeFile(resolve(directory, "local/tracked.ts"), "export const tracked = () => 1;");
  execFileSync("git", ["-C", directory, "add", "-f", "local/tracked.ts"]);
  await writeFile(resolve(directory, "local/private.ts"), "local only");
  return directory;
};

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("Git file selection", () => {
  it("includes ignored tracked files and untracked files, but excludes local ignored files", async () => {
    const directory = await fixture();
    await writeFile(resolve(directory, "new\nfile.ts"), "export const newFile = () => 1;");
    expect((await collectGitFileTree(directory))._unsafeUnwrap()).toEqual([
      { kind: "file", name: ".gitignore" },
      { kind: "directory", name: "local", children: [{ kind: "file", name: "tracked.ts" }] },
      { kind: "file", name: "new\nfile.ts" },
    ]);
  });

  it("reads the working tree rather than treating deleted index entries as existing files", async () => {
    const directory = await fixture();
    await rm(resolve(directory, "local/tracked.ts"));
    expect((await collectGitFileTree(directory))._unsafeUnwrap()).toEqual([{ kind: "file", name: ".gitignore" }]);
  });

  it("limits selection to the requested subtree", async () => {
    const directory = await fixture();
    expect((await collectGitFileTree(resolve(directory, "local")))._unsafeUnwrap())
      .toEqual([{ kind: "file", name: "tracked.ts" }]);
  });

  it("fails closed on symlinks and directories outside a Git repository", async () => {
    const directory = await fixture();
    await symlink("local/tracked.ts", resolve(directory, "linked.ts"));
    expect((await collectGitFileTree(directory))._unsafeUnwrapErr().message).toContain("unsupported entry linked.ts");
    await rm(resolve(directory, ".git"), { recursive: true });
    vi.stubEnv("GIT_CEILING_DIRECTORIES", resolve(directory, ".."));
    const result = await collectGitFileTree(directory);
    expect(result.isErr()).toBe(true);
  });

  it("blocks a new undeclared file through the CLI and reports Git selection accurately", async () => {
    const output = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const directory = await fixture();
    const definitionPath = resolve(directory, "local/contract.json");
    await writeFile(definitionPath, JSON.stringify({ name: "Git fixture", purpose: "No source files allowed", structure: {
      rootMode: "contents",
      defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
      root: { children: [{ kind: "file", name: { type: "literal", value: ".gitignore" }, quantity: "exactly_one" }] },
    } }));
    await rm(resolve(directory, "local/tracked.ts"));
    expect((await runAnatomyCli([directory, "--git-files", "--definition", definitionPath]))._unsafeUnwrap()).toBe(0);
    await writeFile(resolve(directory, "extra.ts"), "export const extra = () => 1;");
    expect((await runAnatomyCli([directory, "--git-files", "--definition", definitionPath, "--format", "json"]))._unsafeUnwrap()).toBe(1);
    const report = JSON.parse(String(output.mock.calls.at(-1)![0]));
    expect(report).toMatchObject({ fileSelection: "git", ignoredNames: [], conforms: false });
  });

  it("does not permit ignores to hide files in Git mode", () => {
    expect(parseCliArguments(["--git-files"])._unsafeUnwrap().gitFiles).toBe(true);
    expect(parseCliArguments(["--git-files", "--ignore", "src"]).isErr()).toBe(true);
  });
});
