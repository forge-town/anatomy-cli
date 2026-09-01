import { err, ok, type Result } from "neverthrow";
import {
  type AnatomyDraftInput,
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

const matchesName = (entry: AnatomyEntry, actualName: string, ignoreCase = false): boolean => {
  return createNamePattern(entry, ignoreCase).test(actualName);
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
): Result<AnatomyCheckResult, AnatomyValidationIssue[]> => {
  const validated = validateAnatomyForPublish(definition);
  if (validated.isErr()) return err(validated.error);

  const issues: AnatomyCheckIssue[] = [];
  const defaults = definition.structure.defaultPolicies;

  const addIssue = (issue: AnatomyCheckIssue): void => {
    issues.push(issue);
  };

  const checkNodes = (
    expectedNodes: AnatomyNode[],
    actualEntries: AnatomyFileTreeEntry[],
    parentPath: string,
    ancestors: PolicyAncestor[],
  ): void => {
    const consumed = new Set<number>();

    const availableIndexes = (): number[] => {
      return actualEntries.flatMap((_, index) => (consumed.has(index) ? [] : [index]));
    };

    const findMatches = (
      entry: AnatomyEntry,
      options: { ignoreCase?: boolean; requireKind?: boolean } = {},
    ): number[] => {
      return availableIndexes().filter((index) => {
        const actual = actualEntries[index];
        if (!actual) return false;
        if (options.requireKind !== false && actual.kind !== entry.kind) {
          return false;
        }

        return matchesName(entry, actual.name, options.ignoreCase);
      });
    };

    const checkEntry = (entry: AnatomyEntry, suppressMissing: boolean): number => {
      const exactNameIndexes = findMatches(entry, { requireKind: false });
      const nestingMismatchIndexes = exactNameIndexes.filter((index) => {
        const actual = actualEntries[index];

        return actual !== undefined && actual.kind !== entry.kind;
      });
      for (const index of nestingMismatchIndexes) {
        const actual = actualEntries[index];
        if (!actual) continue;
        consumed.add(index);
        addIssue({
          code: AnatomyCheckCode.nestingMismatch,
          severity: getPolicy(defaults, ancestors, "nestingMismatch", entry),
          path: joinPath(parentPath, actual.name),
          constraintId: entry.id,
          message: `Expected ${entry.kind} "${getEntryLabel(entry)}" but found ${actual.kind}`,
        });
      }

      const correctIndexes = findMatches(entry);
      const caseInsensitiveIndexes = findMatches(entry, { ignoreCase: true });
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
        nestingMismatchIndexes.length === 0 &&
        nameMismatchIndexes.length === 0
      ) {
        addIssue({
          code: AnatomyCheckCode.missingRequired,
          severity: getPolicy(defaults, ancestors, "missingRequired", entry),
          path: parentPath,
          constraintId: entry.id,
          message: `Expected ${entry.quantity} ${entry.kind} "${getEntryLabel(entry)}" but found ${correctIndexes.length}`,
        });
      }

      for (const [position, index] of correctIndexes.entries()) {
        const actual = actualEntries[index];
        if (!actual) continue;
        consumed.add(index);
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
          ]);
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

  checkNodes(definition.structure.root.children, entries, ".", []);

  const summary = issues.reduce(
    (counts, issue) => ({
      ...counts,
      [issue.severity]: counts[issue.severity] + 1,
    }),
    { block: 0, warn: 0, allow: 0 },
  );

  return ok({ issues, summary, conforms: summary.block === 0 });
};
