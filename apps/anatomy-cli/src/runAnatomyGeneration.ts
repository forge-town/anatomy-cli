import { lstat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { ResultAsync } from "neverthrow";
import type { AnatomyCliOptions } from "./parseCliArguments.js";
import { AnatomyModelError } from "./AnatomyModelError.js";
import { collectFileTree } from "./collectFileTree.js";
import { collectGitFileTree } from "./collectGitFileTree.js";
import { generateAnatomy } from "./generateAnatomy.js";
import { getModelConfigPath } from "./getModelConfigPath.js";
import { readModelConfig } from "./readModelConfig.js";

export const runAnatomyGeneration = (options: AnatomyCliOptions, writeOutput: (value: string) => void = (value) => process.stdout.write(`${value}\n`)) =>
  ResultAsync.fromPromise((async () => {
    const path = getModelConfigPath(options.modelConfigPath ?? undefined);
    const config = await readModelConfig(path);
    if (config.isErr()) throw config.error;
    const apiKey = process.env[config.value.apiKeyEnv];
    if (!apiKey?.trim()) throw new AnatomyModelError(`Set ${config.value.apiKeyEnv} before generation.`);
    if (options.outputPath) {
      const existing = await ResultAsync.fromPromise(lstat(resolve(options.outputPath)), (cause) => cause as NodeJS.ErrnoException);
      if (existing.isOk()) throw new AnatomyModelError("Output already exists; choose another --output file.");
      if (existing.error.code !== "ENOENT") throw new AnatomyModelError("Cannot inspect the output path.");
    }
    const tree = options.gitFiles ? await collectGitFileTree(options.targetPath) : await collectFileTree(options.targetPath, options.ignore);
    if (tree.isErr()) throw tree.error;
    process.stderr.write(`Sending directory names and structure to model ${config.value.model}; source contents are not included.\n`);
    const generated = await generateAnatomy(tree.value, basename(resolve(options.targetPath)), options.instructions ?? "", config.value, apiKey);
    if (generated.isErr()) throw generated.error;
    if (options.outputPath) {
      await writeFile(resolve(options.outputPath), generated.value.json, { flag: "wx" });
      process.stderr.write(`Saved ${resolve(options.outputPath)}.\n`);
    } else writeOutput(generated.value.json.trimEnd());
    const summary = generated.value.summary;
    process.stderr.write(`Generated rules validated. Observed structure: ${summary.block} block, ${summary.warn} warn, ${summary.allow} allow. Source exports were not checked.\n`);
    return 0;
  })(), (cause) => cause instanceof AnatomyModelError ? cause : new AnatomyModelError("Unable to generate or save Anatomy; existing files were not overwritten.", { cause }));
