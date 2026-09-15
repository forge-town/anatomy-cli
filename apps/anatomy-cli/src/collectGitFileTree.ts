import type { AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import { err, ok, ResultAsync, type Result } from "neverthrow";
import { execFile } from "node:child_process";
import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { AnatomyFileTreeError } from "./AnatomyFileTreeError.js";

export const collectGitFileTree = async (
  targetPath: string,
): Promise<Result<AnatomyFileTreeEntry[], AnatomyFileTreeError>> => {
  const directory = resolve(targetPath);
  const inventory = await ResultAsync.fromPromise(
    promisify(execFile)("git", ["-C", directory, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }),
    (cause) => new AnatomyFileTreeError(`Unable to list Git files in ${directory}: ${String(cause)}`, directory),
  );
  if (inventory.isErr()) return err(inventory.error);
  const tree: AnatomyFileTreeEntry[] = [];
  for (const path of [...new Set(inventory.value.stdout.split("\0").filter(Boolean))].sort()) {
    const absolutePath = resolve(directory, path);
    const metadata = await ResultAsync.fromPromise(lstat(absolutePath), (cause) => cause);
    if (metadata.isErr()) {
      if ((metadata.error as NodeJS.ErrnoException).code === "ENOENT") continue;
      return err(new AnatomyFileTreeError(`Unable to inspect ${absolutePath}: ${String(metadata.error)}`, absolutePath));
    }
    if (!metadata.value.isFile()) {
      return err(new AnatomyFileTreeError(`Git file checks require regular files; unsupported entry ${path}`, absolutePath));
    }
    const parts = path.split("/");
    let siblings = tree;
    for (const name of parts.slice(0, -1)) {
      let entry = siblings.find((candidate) => candidate.name === name);
      if (!entry) {
        entry = { kind: "directory", name, children: [] };
        siblings.push(entry);
      }
      if (entry.kind !== "directory") return err(new AnatomyFileTreeError(`Conflicting Git path ${path}`, absolutePath));
      siblings = entry.children;
    }
    siblings.push({ kind: "file", name: parts.at(-1)! });
  }
  return ok(tree);
};
