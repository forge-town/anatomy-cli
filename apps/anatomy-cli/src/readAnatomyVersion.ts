import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Result } from "neverthrow";
import { AnatomyVersionError } from "./AnatomyVersionError.js";

export const readAnatomyVersion = (runtimeUrl = import.meta.url) => {
  let path = runtimeUrl;
  return Result.fromThrowable(() => {
    const entry = fileURLToPath(runtimeUrl);
    const standalone = basename(entry) === "anatomy.mjs";
    path = standalone
      ? join(dirname(entry), "install.json")
      : join(dirname(entry), "..", "package.json");
    const metadata = JSON.parse(readFileSync(path, "utf8"));
    const owned = standalone
      ? metadata.owner === "anatomy-cli/installer-v1"
      : metadata.name === "anatomy-cli";
    if (!owned || typeof metadata.version !== "string" ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(metadata.version))
      throw new AnatomyVersionError(path);
    return metadata.version as string;
  }, (cause) => new AnatomyVersionError(path, { cause }))();
};
