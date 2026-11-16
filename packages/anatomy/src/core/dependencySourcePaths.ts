import type { AnatomyDependencyConfig } from "@anatomy-cli/schemas";
import { matchesDependencyPath } from "./matchesDependencyPath.js";

export const dependencySourcePaths = (files: string[], config: AnatomyDependencyConfig, scope = "."): string[] => {
  const prefix = scope === "." ? "" : `${scope}/`;
  return files.filter((path) => /\.(?:[cm]?[jt]s|[jt]sx)$/i.test(path) && path.startsWith(prefix) && matchesDependencyPath(path.slice(prefix.length), config.rules.flatMap((r) => r.from))).sort();
};
