import { err, ok, Result, ResultAsync } from "neverthrow";
import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { AnatomyDefinitionFileError } from "./AnatomyDefinitionFileError";
import { DefaultAnatomyDefinitionFileName } from "./DefaultAnatomyDefinitionFileName";

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
