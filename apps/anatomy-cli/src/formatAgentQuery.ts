import { resolveAnatomyExportName } from "@anatomy-cli/anatomy/core";
import type { AnatomyDraftInput, AnatomyNode, AnatomyPolicies, AnatomyQuantity, AnatomyQueryWithConstraints } from "@anatomy-cli/schemas";
import { resolve } from "node:path";

export const formatAgentQuery = (
  result: AnatomyQueryWithConstraints,
  definition: AnatomyDraftInput,
  definitionPath: string,
  targetPath: string,
  format: "human" | "json",
): string => {
  const report = {
    ...result,
    definition: { path: resolve(definitionPath), name: definition.name, schemaVersion: definition.structure.schemaVersion },
    targetPath: resolve(targetPath),
  };
  if (format === "json") return JSON.stringify(report, null, 2);

  const quantities: Record<AnatomyQuantity, string> = {
    exactly_one: "required exactly once",
    optional: "optional, at most once",
    one_or_more: "required, one or more",
    zero_or_more: "optional, any number",
  };
  const policyLabels: Record<keyof AnatomyPolicies, string> = {
    missingRequired: "Missing entries",
    unexpectedEntry: "Extra entries",
    nameMismatch: "Wrong name",
    nestingMismatch: "Wrong entry kind",
  };
  const policies = (values: AnatomyPolicies) => Object.entries(values)
    .map(([key, value]) => `${policyLabels[key as keyof AnatomyPolicies]}: ${value.toUpperCase()}`)
    .join("; ");
  const ruleLines = (node: AnatomyNode, inherited: AnatomyPolicies, depth = 0): string[] => {
    const indent = "  ".repeat(depth);
    if (node.kind === "one_of") {
      return [
        `${indent}Choose ${node.minimumMatches}-${node.maximumMatches} alternatives (requirements below apply when selected):`,
        ...node.alternatives.flatMap((entry) => ruleLines(entry, inherited, depth + 1)),
      ];
    }
    const name = node.name.type === "literal" ? node.name.value : node.name.value.replace(
      /<([^<>]+)>/, (placeholder, binding: string) => result.captures[binding] ?? placeholder,
    );
    const effective = { ...inherited, ...node.policyOverrides };
    const overrides = Object.entries(node.policyOverrides).filter(
      ([key, value]) => inherited[key as keyof AnatomyPolicies] !== value,
    );
    return [
      `${indent}${node.kind} ${name} — ${quantities[node.quantity]}`,
      ...(node.kind === "file" && node.exports ? [
        `${indent}  Export: exactly one named function "${resolveAnatomyExportName(node.exports, name, result.captures)}" (${node.exports.policy.toUpperCase()}); type exports do not count; default exports are not allowed`,
      ] : []),
      ...(overrides.length ? [`${indent}  Policies: ${policies(effective)}`] : []),
      ...(node.kind === "directory" ? node.children.flatMap((child) => ruleLines(child, effective, depth + 1)) : []),
    ];
  };

  return [
    `Anatomy query: ${result.status.toUpperCase()} (${result.path})`,
    `Definition: ${report.definition.path}`,
    `Target root: ${report.targetPath}`,
    `Scope: ${result.scopePath}`,
    result.reason ?? "",
    ...result.ancestors.map((ancestor) => `Parent ${ancestor.name} — ${quantities[ancestor.quantity]}`),
    ...result.rules.flatMap((rule) => [
      ...ruleLines(rule.node, rule.policies),
      `  ${policies(rule.policies)}`,
    ]),
    ...(result.rules.length ? [] : [`No entry rules declared. ${policies(result.policies)}`]),
    ...Object.entries(result.captures).map(([name, value]) => `Captured <${name}> = ${value}`),
    ...Object.entries(result.bindings).map(([name, binding]) =>
      `Binding <${name}>: ${[binding.format, binding.pattern ? `full pattern /${binding.pattern}/` : undefined].filter(Boolean).join("; ")}`),
    ...result.groups.map((group) =>
      `Containing one-of: choose ${group.minimumMatches}-${group.maximumMatches} alternatives (${group.rulePath})`),
    "Query only. Run anatomy with the same target and definition, without --query, to check actual files.",
  ].filter(Boolean).join("\n");
};
