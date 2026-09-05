import { err, ok, Result, type Result as ResultType } from "neverthrow";
import type { AnatomyDraftInput, AnatomyEntry, AnatomyNode } from "@anatomy-cli/schemas";

export const AnatomyValidationCode = {
  duplicateId: "duplicate_id",
  duplicateLiteralName: "duplicate_literal_name",
  invalidPlaceholder: "invalid_placeholder",
  invalidBinding: "invalid_binding",
  invalidBindingName: "invalid_binding_name",
  invalidBindingFormat: "invalid_binding_format",
  invalidBindingPattern: "invalid_binding_pattern",
  absolutePath: "absolute_path",
  invalidOneOfRange: "invalid_one_of_range",
  impossibleOneOf: "impossible_one_of",
} as const;

export type AnatomyValidationIssue = {
  code: (typeof AnatomyValidationCode)[keyof typeof AnatomyValidationCode];
  nodeId: string;
  parentId: string | null;
  field: "id" | "name" | "binding" | "minimumMatches" | "maximumMatches";
  message: string;
};

const PlaceholderPattern = /^[^<>/\\]*<[^<>/\\]+>[^<>/\\]*$/;
const BindingNamePattern = /^[A-Za-z][A-Za-z0-9_]*$/;
const SupportedBindingFormats = new Set([
  "PascalCase",
  "camelCase",
  "kebab-case",
  "snake_case",
  "SCREAMING_SNAKE_CASE",
]);
const compilePattern = Result.fromThrowable(
  (pattern: string) => new RegExp(`^(?:${pattern})$`),
  () => undefined,
);
const WindowsDrivePattern = /^[a-zA-Z]:[\\/]/;
const UncPathPattern = /^\\\\/;

const isRealPathExpression = (value: string): boolean => {
  if (value.startsWith("/") || WindowsDrivePattern.test(value) || UncPathPattern.test(value)) {
    return true;
  }

  return value.split(/[\\/]/).includes("..");
};

export const validateAnatomyForPublish = (
  input: AnatomyDraftInput,
): ResultType<AnatomyDraftInput, AnatomyValidationIssue[]> => {
  const issues: AnatomyValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const [bindingName, binding] of Object.entries(input.structure.bindings ?? {})) {
    if (binding.format === undefined && binding.pattern === undefined) {
      issues.push({
        code: AnatomyValidationCode.invalidBinding,
        nodeId: bindingName,
        parentId: null,
        field: "binding",
        message: `Binding "${bindingName}" must define a format, a pattern, or both`,
      });
    }

    if (!BindingNamePattern.test(bindingName)) {
      issues.push({
        code: AnatomyValidationCode.invalidBindingName,
        nodeId: bindingName,
        parentId: null,
        field: "binding",
        message: `Binding name "${bindingName}" must start with a letter and contain only letters, numbers, or underscores`,
      });
    }

    if (binding.format !== undefined && !SupportedBindingFormats.has(binding.format)) {
      issues.push({
        code: AnatomyValidationCode.invalidBindingFormat,
        nodeId: bindingName,
        parentId: null,
        field: "binding",
        message: `Binding "${bindingName}" uses an unsupported format`,
      });
    }

    if (binding.pattern !== undefined && binding.pattern.trim().length === 0) {
      issues.push({
        code: AnatomyValidationCode.invalidBindingPattern,
        nodeId: bindingName,
        parentId: null,
        field: "binding",
        message: `Binding "${bindingName}" must not use an empty pattern`,
      });
    } else if (binding.pattern !== undefined && compilePattern(binding.pattern).isErr()) {
      issues.push({
        code: AnatomyValidationCode.invalidBindingPattern,
        nodeId: bindingName,
        parentId: null,
        field: "binding",
        message: `Binding "${bindingName}" has an invalid regular expression pattern`,
      });
    }
  }

  const validateId = (node: AnatomyNode, parentId: string | null) => {
    if (seenIds.has(node.id)) {
      issues.push({
        code: AnatomyValidationCode.duplicateId,
        nodeId: node.id,
        parentId,
        field: "id",
        message: `Node id "${node.id}" is duplicated`,
      });
    }
    seenIds.add(node.id);
  };

  const validateName = (entry: AnatomyEntry, parentId: string | null) => {
    if (entry.name.type === "placeholder" && !PlaceholderPattern.test(entry.name.value)) {
      issues.push({
        code: AnatomyValidationCode.invalidPlaceholder,
        nodeId: entry.id,
        parentId,
        field: "name",
        message: `Placeholder "${entry.name.value}" has an invalid format`,
      });
    }

    if (isRealPathExpression(entry.name.value)) {
      issues.push({
        code: AnatomyValidationCode.absolutePath,
        nodeId: entry.id,
        parentId,
        field: "name",
        message: `Name "${entry.name.value}" must not be a real path`,
      });
    }
  };

  const validateDuplicateLiteralNames = (nodes: AnatomyNode[], parentId: string | null) => {
    const literalNames = new Map<string, string>();

    for (const node of nodes) {
      if (node.kind === "one_of" || node.name.type !== "literal") {
        continue;
      }

      const existingId = literalNames.get(node.name.value);
      if (existingId) {
        issues.push({
          code: AnatomyValidationCode.duplicateLiteralName,
          nodeId: node.id,
          parentId,
          field: "name",
          message: `Literal name "${node.name.value}" duplicates node "${existingId}"`,
        });
      } else {
        literalNames.set(node.name.value, node.id);
      }
    }
  };

  const visitNodes = (nodes: AnatomyNode[], parentId: string | null) => {
    validateDuplicateLiteralNames(nodes, parentId);

    for (const node of nodes) {
      validateId(node, parentId);

      if (node.kind === "one_of") {
        if (
          node.minimumMatches < 1 ||
          node.maximumMatches < 1 ||
          node.minimumMatches > node.maximumMatches
        ) {
          issues.push({
            code: AnatomyValidationCode.invalidOneOfRange,
            nodeId: node.id,
            parentId,
            field: "minimumMatches",
            message: "One-of minimumMatches must not exceed maximumMatches",
          });
        }

        if (
          node.minimumMatches > node.alternatives.length ||
          node.maximumMatches > node.alternatives.length
        ) {
          issues.push({
            code: AnatomyValidationCode.impossibleOneOf,
            nodeId: node.id,
            parentId,
            field: "maximumMatches",
            message: "One-of match range exceeds its number of alternatives",
          });
        }

        visitNodes(node.alternatives, node.id);
        continue;
      }

      validateName(node, parentId);
      if (node.kind === "directory") {
        visitNodes(node.children, node.id);
      }
    }
  };

  visitNodes(input.structure.root.children, null);

  return issues.length > 0 ? err(issues) : ok(input);
};
