import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { AnatomyDraftInputSchema, type AnatomyDraftInput } from "@anatomy-cli/schemas";
import type { AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";

export const DefaultAnatomyDefinitionFileName = "anatomy.json";

export const DefaultIgnoredNames = [
  ".git",
  ".next",
  ".output",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  DefaultAnatomyDefinitionFileName,
] as const;

export class AnatomyDefinitionFileError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "AnatomyDefinitionFileError";
  }
}

export class AnatomyFileTreeError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "AnatomyFileTreeError";
  }
}

const parseJson = Result.fromThrowable(
  JSON.parse,
  () => new AnatomyDefinitionFileError("Definition is not valid JSON", ""),
);

export const findAnatomyDefinition = async (
  targetPath: string,
): Promise<Result<string, AnatomyDefinitionFileError>> => {
  const resolvedTargetPath = resolve(targetPath);
  let directory = resolvedTargetPath;

  while (true) {
    const candidatePath = join(directory, DefaultAnatomyDefinitionFileName);
    const candidate = await ResultAsync.fromPromise(
      access(candidatePath),
      () => new AnatomyDefinitionFileError("Definition is not readable", candidatePath),
    );
    if (candidate.isOk()) return ok(candidatePath);

    const parentDirectory = dirname(directory);
    if (parentDirectory === directory) break;
    directory = parentDirectory;
  }

  return err(
    new AnatomyDefinitionFileError(
      `Unable to find ${DefaultAnatomyDefinitionFileName} from ${resolvedTargetPath} or its parent directories`,
      resolvedTargetPath,
    ),
  );
};

export const readAnatomyDefinition = (
  path: string,
): ResultAsync<AnatomyDraftInput, AnatomyDefinitionFileError> => {
  const resolvedPath = resolve(path);

  return ResultAsync.fromPromise(
    readFile(resolvedPath, "utf8"),
    () =>
      new AnatomyDefinitionFileError(
        `Unable to read Anatomy definition at ${resolvedPath}`,
        resolvedPath,
      ),
  ).andThen((raw) =>
    parseJson(raw)
      .mapErr((error) => new AnatomyDefinitionFileError(error.message, resolvedPath))
      .andThen((value) => {
        const parsed = AnatomyDraftInputSchema.safeParse(value);

        return parsed.success
          ? ok(parsed.data)
          : err(
              new AnatomyDefinitionFileError(
                `Definition does not match the Anatomy schema: ${parsed.error.message}`,
                resolvedPath,
              ),
            );
      }),
  );
};

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
