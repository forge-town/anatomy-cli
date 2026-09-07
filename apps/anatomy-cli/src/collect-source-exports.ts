import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { err, ok, ResultAsync, type Result } from "neverthrow";
import { AnatomySourceAnalysisError } from "@anatomy-cli/anatomy/core";
import type { AnatomyFunctionExportCheck, AnatomySourceExports } from "@anatomy-cli/schemas";
import { analyzeSourceExports } from "./analyze-source-exports";

export const collectSourceExports = async (
  targetPath: string,
  checks: AnatomyFunctionExportCheck[],
): Promise<Result<Map<string, AnatomySourceExports>, AnatomySourceAnalysisError>> => {
  const inventory = new Map<string, AnatomySourceExports>();
  for (const check of checks) {
    if (inventory.has(check.path)) continue;
    const path = resolve(targetPath, check.path);
    const source = await ResultAsync.fromPromise(readFile(path, "utf8"),
      () => new AnatomySourceAnalysisError(path, `Unable to read source file ${path}`));
    if (source.isErr()) return err(source.error);
    const analyzed = analyzeSourceExports(path, source.value);
    if (analyzed.isErr()) return err(analyzed.error);
    inventory.set(check.path, analyzed.value);
  }
  return ok(inventory);
};
