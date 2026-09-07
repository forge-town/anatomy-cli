import type { AnatomyFunctionExportRule } from "@anatomy-cli/schemas";

export const resolveAnatomyExportName = (
  rule: AnatomyFunctionExportRule,
  filename: string,
  captures: Readonly<Record<string, string>>,
): string => {
  if (rule.name === "file_stem") return filename.replace(/\.[^.]+$/, "");
  if (rule.name.type === "literal") return rule.name.value;
  return rule.name.value.replace(/<([^<>]+)>/, (placeholder, name: string) => captures[name] ?? placeholder);
};
