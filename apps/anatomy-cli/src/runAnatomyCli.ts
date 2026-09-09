import { checkAnatomy, planAnatomyCheck, queryAnatomy, type AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import type { AnatomyDraftInput } from "@anatomy-cli/schemas";
import { err, ok, type Result } from "neverthrow";
import { AnatomyCliExitCode } from "./AnatomyCliExitCode";
import { AnatomyCliUsage } from "./AnatomyCliUsage";
import { AnatomyDefinitionFileError } from "./AnatomyDefinitionFileError";
import { type AnatomyFileTreeError } from "./AnatomyFileTreeError";
import { collectSourceExports } from "./collectSourceExports";
import { collectFileTree } from "./collectFileTree";
import { collectGitFileTree } from "./collectGitFileTree";
import { findAnatomyDefinition } from "./findAnatomyDefinition";
import { formatAgentCheck } from "./formatAgentCheck";
import { formatAgentQuery } from "./formatAgentQuery";
import { formatHumanResult } from "./formatHumanResult";
import { parseCliArguments, type AnatomyCliOptions } from "./parseCliArguments";
import { readAnatomyDefinition } from "./readAnatomyDefinition";

export type AnatomyCliError = Error | AnatomyDefinitionFileError | AnatomyFileTreeError;

export type AnatomyCliDependencies = {
  findDefinition: (
    targetPath: string,
  ) => Promise<Result<string, AnatomyDefinitionFileError>>;
  readDefinition: (path: string) => Promise<Result<AnatomyDraftInput, AnatomyDefinitionFileError>>;
  collectTree: (
    targetPath: string,
    ignoredNames: string[],
  ) => Promise<Result<AnatomyFileTreeEntry[], AnatomyFileTreeError>>;
  writeOutput: (value: string) => void;
  collectExports?: typeof collectSourceExports;
  collectGitTree?: typeof collectGitFileTree;
};

const defaultDependencies: AnatomyCliDependencies = {
  findDefinition: findAnatomyDefinition,
  readDefinition: async (path) => readAnatomyDefinition(path),
  collectTree: collectFileTree,
  writeOutput: (value) => process.stdout.write(`${value}\n`),
};

export const runAnatomyCli = async (
  args: string[],
  dependencies: AnatomyCliDependencies = defaultDependencies,
): Promise<Result<number, AnatomyCliError>> => {
  const optionsResult = parseCliArguments(args);
  if (optionsResult.isErr()) return err(optionsResult.error);

  const options: AnatomyCliOptions = optionsResult.value;
  if (options.help) {
    dependencies.writeOutput(AnatomyCliUsage);

    return ok(AnatomyCliExitCode.success);
  }

  const definitionPath = options.definitionPath
    ? ok(options.definitionPath)
    : await dependencies.findDefinition(options.targetPath);
  if (definitionPath.isErr()) return err(definitionPath.error);

  const definition = await dependencies.readDefinition(definitionPath.value);
  if (definition.isErr()) return err(definition.error);

  const tree = options.gitFiles
    ? await (dependencies.collectGitTree ?? collectGitFileTree)(options.targetPath)
    : await dependencies.collectTree(options.targetPath, options.ignore);
  if (tree.isErr()) return err(tree.error);

  if (options.queryPath !== null) {
    const queried = queryAnatomy(definition.value, options.queryPath);
    if (queried.isErr()) {
      return err(Array.isArray(queried.error)
        ? new AnatomyDefinitionFileError(queried.error.map((issue) => issue.message).join("; "), definitionPath.value)
        : queried.error);
    }
    dependencies.writeOutput(formatAgentQuery(queried.value, definition.value,
      definitionPath.value, options.targetPath, options.format));
    return ok(AnatomyCliExitCode.success);
  }

  const plan = planAnatomyCheck(definition.value, tree.value);
  if (plan.isErr()) return err(new AnatomyDefinitionFileError(
    plan.error.map((issue) => issue.message).join("; "), definitionPath.value));
  const sourceExports = await (dependencies.collectExports ?? collectSourceExports)(options.targetPath, plan.value.exportChecks);
  if (sourceExports.isErr()) return err(sourceExports.error);
  const checked = checkAnatomy(definition.value, tree.value, sourceExports.value);
  if (checked.isErr()) {
    if (!Array.isArray(checked.error)) return err(checked.error);
    return err(
      new AnatomyDefinitionFileError(
        `Anatomy definition failed structural validation: ${checked.error.map((issue) => issue.message).join("; ")}`,
        definitionPath.value,
      ),
    );
  }

  dependencies.writeOutput(
    options.format === "json" ? formatAgentCheck(checked.value, definition.value,
      definitionPath.value, options.targetPath, tree.value, options.ignore, options.gitFiles) : formatHumanResult(checked.value),
  );

  return ok(checked.value.conforms ? AnatomyCliExitCode.success : AnatomyCliExitCode.blocked);
};
