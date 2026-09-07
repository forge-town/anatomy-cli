import {
type AnatomyDraftInput,
type AnatomyEntry,
type AnatomyFunctionExportCheck,
type AnatomyNode,
type AnatomyPolicies,
type AnatomyPolicyOverrides,
type AnatomySourceExports,
} from "@anatomy-cli/schemas";
import { err, ok, type Result as ResultType } from "neverthrow";
import { resolveAnatomyExportName } from "./resolveAnatomyExportName";
import { AnatomyCheckCode } from "./AnatomyCheckCode";
import { evaluateName, type BindingScope, type NameMatch } from "./evaluateName";
import { resolveAnatomyPolicies } from "./resolveAnatomyPolicies";
import { validateAnatomyForPublish, type AnatomyValidationIssue } from "./validateAnatomyForPublish";

export type AnatomyFileTreeEntry =
  | { kind: "file"; name: string }
  | { kind: "directory"; name: string; children: AnatomyFileTreeEntry[] };

export type AnatomyCheckIssue = {
  code: (typeof AnatomyCheckCode)[keyof typeof AnatomyCheckCode];
  severity: AnatomyPolicies[keyof AnatomyPolicies];
  path: string;
  constraintId: string | null;
  message: string;
  expectedExport?: string;
  actualExports?: AnatomySourceExports;
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

type NameMatchCandidate = {
  index: number;
  match: Exclude<NameMatch, { kind: "none" }>;
};

type SuccessfulNameMatchCandidate = {
  index: number;
  match: { kind: "match"; captures: Record<string, string> };
};

type BindingMismatch = Exclude<NameMatch, { kind: "none" } | { kind: "match" }>;

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

export const planAnatomyCheck = (
  definition: AnatomyDraftInput,
  entries: AnatomyFileTreeEntry[],
): ResultType<{ structuralResult: AnatomyCheckResult; exportChecks: AnatomyFunctionExportCheck[] }, AnatomyValidationIssue[]> => {
  const validated = validateAnatomyForPublish(definition);
  if (validated.isErr()) return err(validated.error);

  const issues: AnatomyCheckIssue[] = [];
  const exportChecks: AnatomyFunctionExportCheck[] = [];
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

        if (entry.kind === "file" && actual.kind === "file" && entry.exports) {
          exportChecks.push({
            path: joinPath(parentPath, actual.name), constraintId: entry.id,
            expectedName: resolveAnatomyExportName(entry.exports, actual.name, { ...scope, ...candidate.match.captures }),
            policy: entry.exports.policy,
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

  return ok({ structuralResult: { issues, summary, conforms: summary.block === 0 }, exportChecks });
};
