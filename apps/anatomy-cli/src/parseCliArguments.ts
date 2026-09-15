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
