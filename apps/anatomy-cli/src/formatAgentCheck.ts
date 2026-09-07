import { AnatomyCheckCode, anatomyRulePaths, type AnatomyCheckResult, type AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import type { AnatomyCheckWithDiagnostics, AnatomyDraftInput } from "@anatomy-cli/schemas";
import { resolve } from "node:path";
import { DefaultIgnoredNames } from "./DefaultIgnoredNames";

export const formatAgentCheck = (
  result: AnatomyCheckResult,
  definition: AnatomyDraftInput,
  definitionPath: string,
  targetPath: string,
  tree: AnatomyFileTreeEntry[],
  ignore: string[],
  gitFiles = false,
): string => {
  const rules = anatomyRulePaths(definition);
  const actualByPath = new Map<string, AnatomyFileTreeEntry[]>([[".", tree]]);
  const visit = (entries: AnatomyFileTreeEntry[], parent: string): void => {
    for (const entry of entries) {
      const path = parent ? `${parent}/${entry.name}` : entry.name;
      actualByPath.set(path, [entry]);
      if (entry.kind === "directory") visit(entry.children, path);
    }
  };
  visit(tree, "");
  const report: AnatomyCheckWithDiagnostics = {
    ...result, contractVersion: 1, operation: "check",
    definition: { path: resolve(definitionPath), name: definition.name, schemaVersion: definition.structure.schemaVersion },
    targetPath: resolve(targetPath),
    fileSelection: gitFiles ? "git" : "filesystem",
    ignoredNames: gitFiles ? [] : [...new Set([...DefaultIgnoredNames, ...ignore])],
    issues: result.issues.map((issue) => {
      const rule = issue.constraintId ? rules.get(issue.constraintId) : undefined;
      const entries = actualByPath.get(issue.path) ?? [];
      const actual = issue.code === AnatomyCheckCode.missingRequired || issue.code === AnatomyCheckCode.oneOfMismatch
        ? issue.path === "." ? tree : entries.flatMap((entry) => entry.kind === "directory" ? entry.children : [])
        : entries;
      return {
        ...issue, rulePath: rule?.rulePath ?? null, expected: rule?.node ?? null,
        actual: actual.map(({ kind, name }) => ({ kind, name })),
      };
    }),
  };
  return JSON.stringify(report, null, 2);
};
