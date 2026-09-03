import { err, ok, Result, type Result as ResultType } from "neverthrow";
import {
  type AnatomyDraftInput,
  type AnatomyBinding,
  type AnatomyBindingFormat,
  type AnatomyEntry,
  type AnatomyNode,
  type AnatomyPolicies,
  type AnatomyPolicyOverrides,
} from "@anatomy-cli/schemas";
import { resolveAnatomyPolicies } from "./resolveAnatomyPolicies";
import {
  validateAnatomyForPublish,
  type AnatomyValidationIssue,
} from "./validate-anatomy-for-publish";

export type AnatomyFileTreeEntry =
  | { kind: "file"; name: string }
  | { kind: "directory"; name: string; children: AnatomyFileTreeEntry[] };

export const AnatomyCheckCode = {
  missingRequired: "missing_required",
  unexpectedEntry: "unexpected_entry",
  nameMismatch: "name_mismatch",
  bindingFormatMismatch: "binding_format_mismatch",
  bindingPatternMismatch: "binding_pattern_mismatch",
  bindingConsistencyMismatch: "binding_consistency_mismatch",
  nestingMismatch: "nesting_mismatch",
  quantityExceeded: "quantity_exceeded",
  oneOfMismatch: "one_of_mismatch",
} as const;

export type AnatomyCheckIssue = {
  code: (typeof AnatomyCheckCode)[keyof typeof AnatomyCheckCode];
  severity: AnatomyPolicies[keyof AnatomyPolicies];
  path: string;
  constraintId: string | null;
  message: string;
};

export type AnatomyCheckResult = {
  issues: AnatomyCheckIssue[];
  summary: {
    block: number;
    warn: number;
    allow: number;
  };
  conforms: boolean;
};

type PolicyAncestor = { id: string; overrides: AnatomyPolicyOverrides };
type BindingScope = Readonly<Record<string, string>>;

type NameMatch =
  | { kind: "match"; captures: Record<string, string> }
  | { kind: "binding_format_mismatch"; name: string; value: string; format: AnatomyBindingFormat }
  | { kind: "binding_pattern_mismatch"; name: string; value: string; pattern: string }
  | { kind: "binding_consistency_mismatch"; name: string; expected: string; actual: string }
  | { kind: "none" };

type NameMatchCandidate = {
  index: number;
  match: Exclude<NameMatch, { kind: "none" }>;
};

type SuccessfulNameMatchCandidate = {
  index: number;
  match: { kind: "match"; captures: Record<string, string> };
};

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

const evaluateName = (
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

const joinPath = (parentPath: string, name: string): string => {
  return parentPath === "." ? name : `${parentPath}/${name}`;
};

const getQuantityRange = (
  quantity: AnatomyEntry["quantity"],
): {
  minimum: number;
  maximum: number;
} => {
  switch (quantity) {
    case "optional": {
      return { minimum: 0, maximum: 1 };
    }
    case "exactly_one": {
      return { minimum: 1, maximum: 1 };
    }
    case "one_or_more": {
      return { minimum: 1, maximum: Number.POSITIVE_INFINITY };
    }
    case "zero_or_more": {
      return { minimum: 0, maximum: Number.POSITIVE_INFINITY };
    }
  }
};

const getPolicy = (
  defaults: AnatomyPolicies,
  ancestors: PolicyAncestor[],
  key: keyof AnatomyPolicies,
  entry?: AnatomyEntry,
): AnatomyPolicies[keyof AnatomyPolicies] => {
  return resolveAnatomyPolicies(
    defaults,
    ancestors,
    entry ? { id: entry.id, overrides: entry.policyOverrides } : undefined,
  )[key].value;
};

const getEntryLabel = (entry: AnatomyEntry): string => {
  return entry.name.value;
};

export const checkAnatomy = (
  definition: AnatomyDraftInput,
  entries: AnatomyFileTreeEntry[],
): ResultType<AnatomyCheckResult, AnatomyValidationIssue[]> => {
  const validated = validateAnatomyForPublish(definition);
  if (validated.isErr()) return err(validated.error);

  const issues: AnatomyCheckIssue[] = [];
  const defaults = definition.structure.defaultPolicies;
  const bindings = definition.structure.bindings ?? {};

  const addIssue = (issue: AnatomyCheckIssue): void => {
    issues.push(issue);
  };

  const checkNodes = (
    expectedNodes: AnatomyNode[],
    actualEntries: AnatomyFileTreeEntry[],
    parentPath: string,
    ancestors: PolicyAncestor[],
    scope: BindingScope,
  ): void => {
    const consumed = new Set<number>();

    const availableIndexes = (): number[] => {
      return actualEntries.flatMap((_, index) => (consumed.has(index) ? [] : [index]));
    };

    const findMatches = (
      entry: AnatomyEntry,
      options: { ignoreCase?: boolean; requireKind?: boolean } = {},
    ): NameMatchCandidate[] => {
      return availableIndexes().flatMap((index) => {
        const actual = actualEntries[index];
        if (!actual) return [];
        if (options.requireKind !== false && actual.kind !== entry.kind) {
          return [];
        }

        const match = evaluateName(entry, actual.name, scope, bindings, options.ignoreCase);
        return match.kind === "none" ? [] : [{ index, match }];
      });
    };

    const checkEntry = (entry: AnatomyEntry, suppressMissing: boolean): number => {
      const structuralCandidates = findMatches(entry, { requireKind: false });
      const nestingMismatchCandidates = structuralCandidates.filter((candidate) => {
        const actual = actualEntries[candidate.index];

        return actual !== undefined && actual.kind !== entry.kind;
      });
      for (const candidate of nestingMismatchCandidates) {
        const actual = actualEntries[candidate.index];
        if (!actual) continue;
        consumed.add(candidate.index);
        addIssue({
          code: AnatomyCheckCode.nestingMismatch,
          severity: getPolicy(defaults, ancestors, "nestingMismatch", entry),
          path: joinPath(parentPath, actual.name),
          constraintId: entry.id,
          message: `Expected ${entry.kind} "${getEntryLabel(entry)}" but found ${actual.kind}`,
        });
      }

      const correctCandidates = structuralCandidates.filter(
        (candidate): candidate is SuccessfulNameMatchCandidate => {
          const actual = actualEntries[candidate.index];

          return actual?.kind === entry.kind && candidate.match.kind === "match";
        },
      );
      const bindingMismatchCandidates = structuralCandidates.filter((candidate): candidate is NameMatchCandidate & { match: BindingMismatch } => {
        const actual = actualEntries[candidate.index];

        return actual?.kind === entry.kind && candidate.match.kind !== "match";
      });
      for (const candidate of bindingMismatchCandidates) {
        const actual = actualEntries[candidate.index];
        if (!actual) continue;
        consumed.add(candidate.index);

        const match = candidate.match;
        if (match.kind === "binding_format_mismatch") {
          addIssue({
            code: AnatomyCheckCode.bindingFormatMismatch,
            severity: getPolicy(defaults, ancestors, "nameMismatch", entry),
            path: joinPath(parentPath, actual.name),
            constraintId: entry.id,
            message: `Placeholder <${match.name}> captured "${match.value}" which does not match ${match.format}`,
          });
        } else if (match.kind === "binding_pattern_mismatch") {
          addIssue({
            code: AnatomyCheckCode.bindingPatternMismatch,
            severity: getPolicy(defaults, ancestors, "nameMismatch", entry),
            path: joinPath(parentPath, actual.name),
            constraintId: entry.id,
            message: `Placeholder <${match.name}> captured "${match.value}" which does not match pattern /${match.pattern}/`,
          });
        } else {
          addIssue({
            code: AnatomyCheckCode.bindingConsistencyMismatch,
            severity: getPolicy(defaults, ancestors, "nameMismatch", entry),
            path: joinPath(parentPath, actual.name),
            constraintId: entry.id,
            message: `Placeholder <${match.name}> expected "${match.expected}" but found "${match.actual}"`,
          });
        }
      }

      const correctIndexes = correctCandidates.map((candidate) => candidate.index);
      const caseInsensitiveCandidates = findMatches(entry, { ignoreCase: true });
      const caseInsensitiveIndexes = caseInsensitiveCandidates.map((candidate) => candidate.index);
      const nameMismatchIndexes = caseInsensitiveIndexes.filter(
        (index) => !correctIndexes.includes(index),
      );
      for (const index of nameMismatchIndexes) {
        const actual = actualEntries[index];
        if (!actual) continue;
        consumed.add(index);
        addIssue({
          code: AnatomyCheckCode.nameMismatch,
          severity: getPolicy(defaults, ancestors, "nameMismatch", entry),
          path: joinPath(parentPath, actual.name),
          constraintId: entry.id,
          message: `Expected name "${getEntryLabel(entry)}" but found "${actual.name}"`,
        });
      }

      const { minimum, maximum } = getQuantityRange(entry.quantity);
      if (
        !suppressMissing &&
        correctIndexes.length < minimum &&
        nestingMismatchCandidates.length === 0 &&
        nameMismatchIndexes.length === 0 &&
        bindingMismatchCandidates.length === 0
      ) {
        addIssue({
          code: AnatomyCheckCode.missingRequired,
          severity: getPolicy(defaults, ancestors, "missingRequired", entry),
          path: parentPath,
          constraintId: entry.id,
          message: `Expected ${entry.quantity} ${entry.kind} "${getEntryLabel(entry)}" but found ${correctIndexes.length}`,
        });
      }

      for (const [position, candidate] of correctCandidates.entries()) {
        const actual = actualEntries[candidate.index];
        if (!actual) continue;
        consumed.add(candidate.index);
        if (position >= maximum) {
          addIssue({
            code: AnatomyCheckCode.quantityExceeded,
            severity: getPolicy(defaults, ancestors, "unexpectedEntry", entry),
            path: joinPath(parentPath, actual.name),
            constraintId: entry.id,
            message: `Entry "${actual.name}" exceeds quantity ${entry.quantity}`,
          });
        }

        if (entry.kind === "directory" && actual.kind === "directory") {
          checkNodes(entry.children, actual.children, joinPath(parentPath, actual.name), [
            ...ancestors,
            { id: entry.id, overrides: entry.policyOverrides },
          ], {
            ...scope,
            ...candidate.match.captures,
          });
        }
      }

      return correctIndexes.length;
    };

    for (const node of expectedNodes) {
      if (node.kind !== "one_of") {
        checkEntry(node, false);
        continue;
      }

      const matchedAlternatives = node.alternatives.filter(
        (alternative) => findMatches(alternative).length > 0,
      );
      if (
        matchedAlternatives.length < node.minimumMatches ||
        matchedAlternatives.length > node.maximumMatches
      ) {
        const policyKey =
          matchedAlternatives.length < node.minimumMatches ? "missingRequired" : "unexpectedEntry";
        addIssue({
          code: AnatomyCheckCode.oneOfMismatch,
          severity: getPolicy(defaults, ancestors, policyKey),
          path: parentPath,
          constraintId: node.id,
          message: `One-of requires ${node.minimumMatches}-${node.maximumMatches} alternatives but matched ${matchedAlternatives.length}`,
        });
      }

      for (const alternative of matchedAlternatives) {
        checkEntry(alternative, true);
      }
    }

    for (const index of availableIndexes()) {
      const actual = actualEntries[index];
      if (!actual) continue;
      addIssue({
        code: AnatomyCheckCode.unexpectedEntry,
        severity: getPolicy(defaults, ancestors, "unexpectedEntry"),
        path: joinPath(parentPath, actual.name),
        constraintId: null,
        message: `Unexpected ${actual.kind} "${actual.name}"`,
      });
    }
  };

  checkNodes(definition.structure.root.children, entries, ".", [], {});

  const summary = issues.reduce(
    (counts, issue) => ({
      ...counts,
      [issue.severity]: counts[issue.severity] + 1,
    }),
    { block: 0, warn: 0, allow: 0 },
  );

  return ok({ issues, summary, conforms: summary.block === 0 });
};
