import { err, ok, type Result } from "neverthrow";

export const AnatomyCliFormatValues = ["human", "json"] as const;

export type AnatomyCliOptions = {
  definitionPath: string;
  targetPath: string;
  format: (typeof AnatomyCliFormatValues)[number];
  ignore: string[];
  help: boolean;
};

export class AnatomyCliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnatomyCliArgumentError";
  }
}

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
    definitionPath: "",
    targetPath: ".",
    format: "human",
    ignore: [],
    help: false,
  };
  const consumedIndexes = new Set<number>();

  for (const [index, argument] of args.entries()) {
    if (consumedIndexes.has(index)) continue;
    if (!argument) continue;

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--definition" || argument === "-d") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.definitionPath = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--target" || argument === "-t") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      options.targetPath = value.value;
      consumedIndexes.add(index + 1);
      continue;
    }

    if (argument === "--format") {
      const value = getOptionValue(args, index, argument);
      if (value.isErr()) return err(value.error);
      if (!AnatomyCliFormatValues.includes(value.value as AnatomyCliOptions["format"])) {
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

    if (!argument.startsWith("-") && !options.definitionPath) {
      options.definitionPath = argument;
      continue;
    }

    return err(new AnatomyCliArgumentError(`Unknown argument "${argument}"`));
  }

  if (!options.help && !options.definitionPath) {
    return err(
      new AnatomyCliArgumentError(
        "An Anatomy definition is required via --definition or the first positional argument",
      ),
    );
  }

  return ok(options);
};

export const AnatomyCliUsage = [
  "Usage: anatomy-cli --definition <file> [options]",
  "",
  "Options:",
  "  -d, --definition <file>  Anatomy Draft or Version JSON",
  "  -t, --target <directory> Target directory (default: current directory)",
  "      --format <format>    human or json (default: human)",
  "      --ignore <paths>     Comma-separated names; may be repeated",
  "  -h, --help               Show this help",
].join("\n");
