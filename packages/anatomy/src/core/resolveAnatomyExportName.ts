import type { AnatomyFunctionExportRule } from "@anatomy-cli/schemas";
import { renderNameTemplate } from "./renderNameTemplate.js";

export const resolveAnatomyExportName = (
  rule: AnatomyFunctionExportRule,
  filename: string,
  captures: Readonly<Record<string, string>>,
): string => {
  if (rule.name === "file_stem") return filename.replace(/\.[^.]+$/, "");
  if (rule.name.type === "literal") return rule.name.value;
  return renderNameTemplate(rule.name.value, captures);
};
