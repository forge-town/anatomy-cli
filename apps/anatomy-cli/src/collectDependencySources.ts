import { AnatomyResourceLimits } from "@anatomy-cli/anatomy";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ResultAsync } from "neverthrow";
import type { AnatomyDependencyConfig } from "@anatomy-cli/schemas";
import { dependencySourcePaths, AnatomySourceAnalysisError } from "@anatomy-cli/anatomy/core";

export const collectDependencySources = (target: string, files: string[], boundaries: { config: AnatomyDependencyConfig; scope: string }[]) => ResultAsync.fromPromise((async () => {
  const sources: Record<string, string> = {};
  const paths = new Set(boundaries.flatMap(({ config, scope }) => dependencySourcePaths(files, config, scope)));
  let total = 0;
  for (const path of paths) {
    const metadata = await ResultAsync.fromPromise(stat(resolve(target, path)), () => new AnatomySourceAnalysisError(path, `Unable to inspect dependency source ${path}`));
    if (metadata.isErr()) throw metadata.error;
    if (metadata.value.size > AnatomyResourceLimits.sourceBytes) throw new AnatomySourceAnalysisError(path, "Dependency source byte limit exceeded");
    const content = await ResultAsync.fromPromise(readFile(resolve(target, path), "utf8"), () => new AnatomySourceAnalysisError(path, `Unable to read dependency source ${path}`));
    if (content.isErr()) throw content.error;
    total += new TextEncoder().encode(content.value).length;
    if (total > AnatomyResourceLimits.totalSourceBytes) throw new AnatomySourceAnalysisError(path, "Dependency source collection byte limit exceeded");
    sources[path] = content.value;
  }
  return sources;
})(), (cause) => cause instanceof AnatomySourceAnalysisError ? cause : new AnatomySourceAnalysisError(target, `Unable to collect dependency sources: ${String(cause)}`));
