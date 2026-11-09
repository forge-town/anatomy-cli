import { err, ok, type Result } from "neverthrow";
import { AnatomyCliArgumentError } from "./AnatomyCliArgumentError.js";
import { AnatomyCliFormatValues } from "./AnatomyCliFormatValues.js";

export type AnatomyCliOptions = {
  definitionPath: string | null;
  bundlePath: string | null;
  targetPath: string;
  format: (typeof AnatomyCliFormatValues)[number];
  ignore: string[];
  help: boolean;
  version: boolean;
  watch: boolean;
  generate: boolean;
  modelConfigPath: string | null;
  outputPath: string | null;
  instructions: string | null;
  queryPath: string | null;
  gitFiles: boolean;
};

const getOptionValue = (
  args: string[],
  index: number,
  option: string,
): Result<string, AnatomyCliArgumentError> => {
  const value = args[index + 1];

  return value && !value.startsWith("-")
    ? ok(value)
    : err(new AnatomyCliArgumentError(`${option} requires a value`));
};

export const parseCliArguments = (
  args: string[],
): Result<AnatomyCliOptions, AnatomyCliArgumentError> => {
  const options: AnatomyCliOptions = {
    definitionPath: null,
    bundlePath: null,
    targetPath: ".",
    format: "human",
    ignore: [],
    help: false,
    version: false,
    watch: false,
    generate: false,
    modelConfigPath: null,
    outputPath: null,
    instructions: null,
    queryPath: null,
    gitFiles: false,
  };
  const consumedIndexes = new Set<number>();
  let targetSpecified = false;

  for (const [index, argument] of args.entries()) {
    if (consumedIndexes.has(index)) continue;
    if (!argument) continue;

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--version" || argument === "-v") {
      options.version = true;
      continue;
    }

    if (argument === "--generate") {
      options.generate = true;
      continue;
    }
    if (["--model-config", "--output", "--instructions"].includes(argument)) {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      const key = argument === "--model-config" ? "modelConfigPath" : argument === "--output" ? "outputPath" : "instructions";
      if (options[key] !== null) return err(new AnatomyCliArgumentError(`${argument} may only be specified once`));
      options[key] = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--watch") {
      options.watch = true;
      continue;
    }

    if (argument === "--git-files") {
      options.gitFiles = true;
      continue;
    }

    if (argument === "--definition" || argument === "-d") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.definitionPath = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--bundle") {
      if (options.bundlePath !== null)
        return err(
          new AnatomyCliArgumentError("Bundle may only be specified once"),
        );
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.bundlePath = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--query") {
      if (options.queryPath !== null)
        return err(
          new AnatomyCliArgumentError("Query path may only be specified once"),
        );
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.queryPath = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--target" || argument === "-t") {
      if (targetSpecified) {
        return err(
          new AnatomyCliArgumentError(
            "Target directory may only be specified once",
          ),
        );
      }
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.targetPath = value.value;
      targetSpecified = true;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--format") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      if (
        !AnatomyCliFormatValues.includes(
          value.value as AnatomyCliOptions["format"],
        )
      ) {
        return err(
          new AnatomyCliArgumentError(
            `Unsupported format "${value.value}"; expected human or json`,
          ),
        );
      }
      options.format = value.value as AnatomyCliOptions["format"];
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--ignore") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.ignore.push(
        ...value.value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
      consumedIndexes.add(index + 1);
      continue;
    }

    if (!argument.startsWith("-") && !targetSpecified) {
      options.targetPath = argument;
      targetSpecified = true;
      continue;
    }

    return err(new AnatomyCliArgumentError(`Unknown argument "${argument}"`));
  }

  if (options.generate && (options.watch || options.queryPath !== null || options.bundlePath !== null || options.definitionPath !== null))
    return err(new AnatomyCliArgumentError("--generate cannot be combined with --watch, --query, --bundle or --definition"));
  if (!options.generate && (options.modelConfigPath !== null || options.outputPath !== null || options.instructions !== null))
    return err(new AnatomyCliArgumentError("Model configuration, output and instructions options require --generate"));
  if (options.watch && options.queryPath !== null)
    return err(new AnatomyCliArgumentError("--watch cannot be combined with --query"));

  if (options.queryPath !== null && options.ignore.length > 0) {
    return err(
      new AnatomyCliArgumentError(
        "--ignore is only supported for checks; queries describe declared constraints",
      ),
    );
  }
  if (options.gitFiles && options.ignore.length > 0) {
    return err(
      new AnatomyCliArgumentError(
        "--git-files cannot be combined with --ignore",
      ),
    );
  }
  if (options.bundlePath !== null && options.definitionPath !== null)
    return err(
      new AnatomyCliArgumentError(
        "--bundle and --definition are mutually exclusive",
      ),
    );
  if (options.bundlePath !== null && options.ignore.length > 0)
    return err(
      new AnatomyCliArgumentError(
        "--bundle requires a complete tree and cannot be combined with --ignore",
      ),
    );
  return ok(options);
};
