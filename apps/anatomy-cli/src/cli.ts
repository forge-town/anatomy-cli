import { err, ok, type Result } from "neverthrow";
import { checkAnatomy, type AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import type { AnatomyDraftInput } from "@anatomy-cli/schemas";
import { AnatomyCliUsage, parseCliArguments, type AnatomyCliOptions } from "./cli-arguments";
import {
  collectFileTree,
  readAnatomyDefinition,
  type AnatomyDefinitionFileError,
  type AnatomyFileTreeError,
} from "./filesystem";
import { formatHumanResult, formatJsonResult } from "./format-result";

export const AnatomyCliExitCode = {
  success: 0,
  blocked: 1,
  operationalError: 2,
} as const;

export type AnatomyCliError = Error | AnatomyDefinitionFileError | AnatomyFileTreeError;

export type AnatomyCliDependencies = {
  readDefinition: (path: string) => Promise<Result<AnatomyDraftInput, AnatomyDefinitionFileError>>;
  collectTree: (
    targetPath: string,
    ignoredNames: string[],
  ) => Promise<Result<AnatomyFileTreeEntry[], AnatomyFileTreeError>>;
  writeOutput: (value: string) => void;
};

const defaultDependencies: AnatomyCliDependencies = {
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

  const definition = await dependencies.readDefinition(options.definitionPath);
  if (definition.isErr()) return err(definition.error);

  const tree = await dependencies.collectTree(options.targetPath, options.ignore);
  if (tree.isErr()) return err(tree.error);

  const checked = checkAnatomy(definition.value, tree.value);
  if (checked.isErr()) {
    return err(
      new Error(
        `Anatomy definition failed structural validation: ${checked.error.map((issue) => issue.message).join("; ")}`,
      ),
    );
  }

  dependencies.writeOutput(
    options.format === "json" ? formatJsonResult(checked.value) : formatHumanResult(checked.value),
  );

  return ok(checked.value.conforms ? AnatomyCliExitCode.success : AnatomyCliExitCode.blocked);
};
