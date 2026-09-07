import { Result } from "neverthrow";
import type { AnatomyEntry, AnatomyBinding, AnatomyBindingFormat } from "@anatomy-cli/schemas";

export type BindingScope = Readonly<Record<string, string>>;

export type NameMatch =
  | { kind: "match"; captures: Record<string, string> }
  | { kind: "binding_format_mismatch"; name: string; value: string; format: AnatomyBindingFormat }
  | { kind: "binding_pattern_mismatch"; name: string; value: string; pattern: string }
  | { kind: "binding_consistency_mismatch"; name: string; expected: string; actual: string }
  | { kind: "none" };

type BindingMismatch = Exclude<NameMatch, { kind: "none" } | { kind: "match" }>;

const escapeRegularExpression = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createNamePattern = (entry: AnatomyEntry, ignoreCase = false): RegExp => {
  if (entry.name.type === "literal") {
    return new RegExp(
      `^${escapeRegularExpression(entry.name.value)}$`,
      ignoreCase ? "i" : undefined,
    );
  }

  const openingBracket = entry.name.value.indexOf("<");
  const closingBracket = entry.name.value.indexOf(">", openingBracket + 1);
  const prefix = entry.name.value.slice(0, openingBracket);
  const suffix = entry.name.value.slice(closingBracket + 1);
  const placeholderExpression = suffix.includes(".") ? "[^./\\\\]+" : "[^/\\\\]+";

  return new RegExp(
    `^${escapeRegularExpression(prefix)}${placeholderExpression}${escapeRegularExpression(suffix)}$`,
    ignoreCase ? "i" : undefined,
  );
};

const parsePlaceholder = (
  entry: AnatomyEntry,
): { name: string; prefix: string; suffix: string } | undefined => {
  if (entry.name.type !== "placeholder") return undefined;

  const openingBracket = entry.name.value.indexOf("<");
  const closingBracket = entry.name.value.indexOf(">", openingBracket + 1);
  if (openingBracket < 0 || closingBracket < 0) return undefined;

  return {
    name: entry.name.value.slice(openingBracket + 1, closingBracket),
    prefix: entry.name.value.slice(0, openingBracket),
    suffix: entry.name.value.slice(closingBracket + 1),
  };
};

const bindingFormatPatterns: Record<AnatomyBindingFormat, RegExp> = {
  PascalCase: /^[A-Z][A-Za-z0-9]*$/,
  camelCase: /^[a-z][A-Za-z0-9]*$/,
  "kebab-case": /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  snake_case: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
  SCREAMING_SNAKE_CASE: /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
};

const compilePattern = Result.fromThrowable(
  (pattern: string) => new RegExp(`^(?:${pattern})$`),
  () => undefined,
);

const matchesBinding = (binding: AnatomyBinding, value: string): BindingMismatch | undefined => {
  if (
    binding.format !== undefined &&
    (bindingFormatPatterns[binding.format] === undefined ||
      !bindingFormatPatterns[binding.format].test(value))
  ) {
    return {
      kind: "binding_format_mismatch",
      name: "",
      value,
      format: binding.format,
    };
  }

  if (binding.pattern !== undefined) {
    const compiledPattern = compilePattern(binding.pattern);
    if (compiledPattern.isErr()) {
      return {
        kind: "binding_pattern_mismatch",
        name: "",
        value,
        pattern: binding.pattern,
      };
    }

    if (!compiledPattern.value.test(value)) {
      return {
        kind: "binding_pattern_mismatch",
        name: "",
        value,
        pattern: binding.pattern,
      };
    }
  }

  return undefined;
};

export const evaluateName = (
  entry: AnatomyEntry,
  actualName: string,
  scope: BindingScope,
  bindings: Readonly<Record<string, AnatomyBinding>>,
  ignoreCase = false,
): NameMatch => {
  if (entry.name.type === "literal") {
    return createNamePattern(entry, ignoreCase).test(actualName)
      ? { kind: "match", captures: {} }
      : { kind: "none" };
  }

  const placeholder = parsePlaceholder(entry);
  if (!placeholder) return { kind: "none" };

  const placeholderExpression = placeholder.suffix.includes(".")
    ? "[^./\\\\]+"
    : "[^/\\\\]+";
  const pattern = new RegExp(
    `^${escapeRegularExpression(placeholder.prefix)}(${placeholderExpression})${escapeRegularExpression(placeholder.suffix)}$`,
    ignoreCase ? "i" : undefined,
  );
  const match = pattern.exec(actualName);
  if (!match) return { kind: "none" };

  const capturedValue = match[1];
  if (capturedValue === undefined) return { kind: "none" };

  const boundValue = scope[placeholder.name];
  if (boundValue !== undefined && boundValue !== capturedValue) {
    return {
      kind: "binding_consistency_mismatch",
      name: placeholder.name,
      expected: boundValue,
      actual: capturedValue,
    };
  }

  const binding = bindings[placeholder.name];
  if (binding !== undefined) {
    const bindingMismatch = matchesBinding(binding, capturedValue);
    if (bindingMismatch !== undefined) {
      return { ...bindingMismatch, name: placeholder.name };
    }
  }

  return {
    kind: "match",
    captures: boundValue === undefined ? { [placeholder.name]: capturedValue } : {},
  };
};
