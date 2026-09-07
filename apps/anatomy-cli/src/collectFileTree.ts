import type { AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { AnatomyFileTreeError } from "./AnatomyFileTreeError";
import { DefaultIgnoredNames } from "./DefaultIgnoredNames";

const collectDirectory = async (
  directory: string,
  ignoredNames: ReadonlySet<string>,
): Promise<Result<AnatomyFileTreeEntry[], AnatomyFileTreeError>> => {
  const entriesResult = await ResultAsync.fromPromise(
    readdir(directory, { withFileTypes: true }),
    () => new AnatomyFileTreeError(`Unable to read target directory ${directory}`, directory),
  );
  if (entriesResult.isErr()) return err(entriesResult.error);

  const tree: AnatomyFileTreeEntry[] = [];
  const entries = [...entriesResult.value].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    if (ignoredNames.has(entry.name) || entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      const childPath = join(directory, entry.name);
      const children = await collectDirectory(childPath, ignoredNames);
      if (children.isErr()) return err(children.error);
      tree.push({
        kind: "directory",
        name: entry.name,
        children: children.value,
      });
      continue;
    }

    if (entry.isFile()) {
      tree.push({ kind: "file", name: entry.name });
    }
  }

  return ok(tree);
};

export const collectFileTree = (
  targetPath: string,
  additionalIgnoredNames: string[] = [],
): Promise<Result<AnatomyFileTreeEntry[], AnatomyFileTreeError>> => {
  const ignoredNames = new Set<string>([...DefaultIgnoredNames, ...additionalIgnoredNames]);

  return collectDirectory(resolve(targetPath), ignoredNames);
};
