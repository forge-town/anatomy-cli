import { fstatSync } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Result, ResultAsync } from "neverthrow";
import type { AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import { AnatomyWatchError } from "./AnatomyWatchError.js";
import { collectFileTree } from "./collectFileTree.js";
import { collectGitFileTree } from "./collectGitFileTree.js";
import { DefaultAnatomyDefinitionFileName } from "./DefaultAnatomyDefinitionFileName.js";
import type { AnatomyCliOptions } from "./parseCliArguments.js";

export const readWatchSnapshot = (options: AnatomyCliOptions) =>
  ResultAsync.fromPromise((async () => {
    const root = resolve(options.targetPath);
    const paths = new Set<string>();
    const explicit = options.bundlePath ?? options.definitionPath;
    if (explicit !== null) paths.add(resolve(explicit));
    else {
      let directory = root;
      while (true) {
        paths.add(join(directory, DefaultAnatomyDefinitionFileName));
        const parent = dirname(directory);
        if (parent === directory) break;
        directory = parent;
      }
    }
    const inventory = options.gitFiles
      ? await collectGitFileTree(root)
      : await collectFileTree(root, options.ignore);
    const visit = (entries: AnatomyFileTreeEntry[], directory: string): void => {
      for (const entry of entries) {
        const path = join(directory, entry.name);
        paths.add(path);
        if (entry.kind === "directory") visit(entry.children, path);
      }
    };
    if (inventory.isOk()) visit(inventory.value, root);
    const outputs = [1, 2].map((fd) => Result.fromThrowable(
      () => fstatSync(fd, { bigint: true }),
      (cause) => new AnatomyWatchError("Unable to inspect watch output streams", { cause }),
    )());
    for (const output of outputs) if (output.isErr()) throw output.error;
    const outputFiles = outputs.flatMap((output) => output.isOk() && output.value.isFile() ? [output.value] : []);
    const stamps: unknown[] = [inventory.isErr() ? ["inventory-error", inventory.error.message] : "inventory-ok"];
    const sorted = [...paths].sort();
    const batchSize = 64;
    for (let offset = 0; offset < sorted.length; offset += batchSize) {
      stamps.push(...await Promise.all(sorted.slice(offset, offset + batchSize).map(async (path) => {
        const metadata = await ResultAsync.fromPromise(stat(path, { bigint: true }), (cause) => cause as NodeJS.ErrnoException);
        if (metadata.isErr()) return [path, "unavailable", metadata.error.code];
        const info = metadata.value;
        if (info.isDirectory()) return [path, "directory"];
        if (outputFiles.some((output) => output.dev === info.dev && output.ino === info.ino))
          return [path, "output", String(info.dev), String(info.ino)];
        return [path, String(info.mode), String(info.dev), String(info.ino), String(info.size), String(info.mtimeNs), String(info.ctimeNs)];
      })));
    }
    return JSON.stringify(stamps);
  })(), (cause) => cause instanceof AnatomyWatchError ? cause : new AnatomyWatchError("Unable to snapshot watched files", { cause }));
