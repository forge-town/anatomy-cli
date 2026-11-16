import { Result } from "neverthrow";
import type { AnatomyEntry, AnatomyBinding, AnatomyBindingFormat } from "@anatomy-cli/schemas";
import { bindingFormatPatterns } from "./bindingFormatPatterns.js";
import { formatBindingValue } from "./formatBindingValue.js";
import { parseNameTemplate } from "./parseNameTemplate.js";

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
    return new RegExp(
      `^${escapeRegularExpression(entry.name.value)}$`,
      ignoreCase ? "i" : undefined,
    ).test(actualName)
      ? { kind: "match", captures: {} }
      : { kind: "none" };
  }
  const tokens = parseNameTemplate(entry.name.value);
  if (!tokens) return { kind: "none" };
  const placeholders = tokens.filter((token) => token.kind === "placeholder");
  const buildPattern = (fallback: boolean): string | undefined => {
    let source = "^",
      group = 0;
    let previousUnbound = false;
    const groups = new Map<string, number>();
    for (const [index, token] of tokens.entries()) {
      if (token.kind === "literal") {
        source += escapeRegularExpression(token.value);
        previousUnbound = false;
        continue;
      }
      group++;
      const known = Object.hasOwn(scope, token.name) ? scope[token.name] : undefined;
      const previous = groups.get(token.name);
      if (token.format && known === undefined && previous === undefined) return undefined;
      if (token.format && known === undefined && previousUnbound) return undefined;
      if (known === "" && !token.optional) return undefined;
      if (!fallback && known !== undefined) {
        const expected = token.format ? formatBindingValue(known, token.format) : known;
        const escaped = escapeRegularExpression(expected);
        source +=
          "(" +
          (token.format
            ? escaped.replace(
                /[A-Za-z]/g,
                (letter) => `[${letter.toLowerCase()}${letter.toUpperCase()}]`,
              )
            : escaped) +
          ")";
      } else if (!fallback && previous !== undefined && !token.format) source += `(\\${previous})`;
      else {
        const excludesDot = tokens
          .slice(index + 1)
          .some((part) => part.kind === "literal" && part.value.includes("."));
        source +=
          "(" + (excludesDot ? "[^./\\\\]" : "[^/\\\\]") + (token.optional ? "*?" : "+?") + ")";
      }
      if (previous === undefined) groups.set(token.name, group);
      previousUnbound = known === undefined && previous === undefined && token.format === undefined;
    }
    return source + "$";
  };
  const exactPattern = buildPattern(false);
  if (!exactPattern) return { kind: "none" };
  const flags = ignoreCase ? "i" : undefined;
  const match =
    new RegExp(exactPattern, flags).exec(actualName) ??
    new RegExp(buildPattern(true)!, flags).exec(actualName);
  if (!match) return { kind: "none" };
  const captures: Record<string, string> = {};
  for (const [index, placeholder] of placeholders.entries()) {
    const captured = match[index + 1]!;
    const bound = Object.hasOwn(captures, placeholder.name)
      ? captures[placeholder.name]
      : Object.hasOwn(scope, placeholder.name)
        ? scope[placeholder.name]
        : undefined;
    if (placeholder.format) {
      if (bound === undefined) return { kind: "none" };
      if (!bindingFormatPatterns[placeholder.format].test(captured))
        return {
          kind: "binding_format_mismatch",
          name: placeholder.name,
          value: captured,
          format: placeholder.format,
        };
      const expected = formatBindingValue(bound, placeholder.format);
      if (captured.toLowerCase() !== expected.toLowerCase())
        return {
          kind: "binding_consistency_mismatch",
          name: placeholder.name,
          expected,
          actual: captured,
        };
    } else {
      if (bound !== undefined && bound !== captured)
        return {
          kind: "binding_consistency_mismatch",
          name: placeholder.name,
          expected: bound,
          actual: captured,
        };
      const binding = Object.hasOwn(bindings, placeholder.name)
        ? bindings[placeholder.name]
        : undefined;
      if (binding && !(placeholder.optional && captured === "")) {
        const mismatch = matchesBinding(binding, captured);
        if (mismatch) return { ...mismatch, name: placeholder.name };
      }
      if (bound === undefined) captures[placeholder.name] = captured;
    }
  }
  return { kind: "match", captures };
};
