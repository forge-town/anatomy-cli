import type { AnatomyCheckResult } from "@anatomy-cli/anatomy/core";

export const formatHumanResult = (result: AnatomyCheckResult): string => {
  const status = result.conforms ? "PASS" : "BLOCK";
  const header = `Anatomy check: ${status} (${result.summary.block} block, ${result.summary.warn} warn, ${result.summary.allow} allow)`;
  if (result.issues.length === 0) return header;

  return [
    header,
    "",
    ...result.issues.map(
      (issue) => `[${issue.severity.toUpperCase()}] ${issue.path} ${issue.code}: ${issue.message}`,
    ),
  ].join("\n");
};

export const formatJsonResult = (result: AnatomyCheckResult): string => {
  return JSON.stringify(result, null, 2);
};
