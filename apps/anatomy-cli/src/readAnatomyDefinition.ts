import { AnatomyDraftInputSchema, type AnatomyDraftInput } from "@anatomy-cli/schemas";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AnatomyDefinitionFileError } from "./AnatomyDefinitionFileError.js";

const parseJson = Result.fromThrowable(
  JSON.parse,
  () => new AnatomyDefinitionFileError("Definition is not valid JSON", ""),
);

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
