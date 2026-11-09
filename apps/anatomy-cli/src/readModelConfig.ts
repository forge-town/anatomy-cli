import { readFile } from "node:fs/promises";
import { ResultAsync } from "neverthrow";
import { AnatomyModelConfigSchema } from "./AnatomyModelConfigSchema.js";
import { AnatomyModelError } from "./AnatomyModelError.js";

export const readModelConfig = (path: string) => ResultAsync.fromPromise((async () => {
  const raw = await readFile(path, "utf8");
  const parsed = AnatomyModelConfigSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new AnatomyModelError("Invalid model configuration; check base URL, model and API-key environment variable name.");
  return parsed.data;
})(), (cause) => cause instanceof AnatomyModelError ? cause : new AnatomyModelError("Cannot read model configuration. Run anatomy config model first.", { cause }));
