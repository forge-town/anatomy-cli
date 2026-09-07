import { err, ok, type Result } from "neverthrow";
import { AnatomyQueryWithConstraintsSchema, type AnatomyDraftInput, type AnatomyNode, type AnatomyQueryWithConstraints } from "@anatomy-cli/schemas";
import { evaluateName } from "./match-anatomy-name";
import { resolveAnatomyPolicies } from "./resolveAnatomyPolicies";
import { anatomyRulePaths } from "./anatomy-rule-paths";
import { validateAnatomyForPublish, type AnatomyValidationIssue } from "./validate-anatomy-for-publish";

const QueryStatus = AnatomyQueryWithConstraintsSchema.shape.status.enum;

export class AnatomyQueryPathError extends Error {
  constructor(public readonly path: string) {
    super(`Query path must be relative to the target, without parent traversal: ${path}`);
    this.name = "AnatomyQueryPathError";
  }
}

export const queryAnatomy = (
  definition: AnatomyDraftInput,
  path: string,
): Result<AnatomyQueryWithConstraints, AnatomyValidationIssue[] | AnatomyQueryPathError> => {
  const normalized = path.replaceAll("\\", "/");
  if (!path || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) ||
      normalized.split("/").includes("..") || normalized.includes("\0")) {
    return err(new AnatomyQueryPathError(path));
  }
  const validated = validateAnatomyForPublish(definition);
  if (validated.isErr()) return err(validated.error);

  const parts = normalized.split("/").filter((part) => part && part !== ".");
  const registry = anatomyRulePaths(definition);
  const defaults = definition.structure.defaultPolicies;
  const policyAncestors: Parameters<typeof resolveAnatomyPolicies>[1] = [];
  const result: AnatomyQueryWithConstraints = {
    contractVersion: 1, operation: "query", path: parts.join("/") || ".", scopePath: ".",
    status: QueryStatus.resolved, reason: null, captures: {}, bindings: definition.structure.bindings ?? {},
    policies: defaults, ancestors: [], rules: [], matches: [], groups: [],
  };
  const policiesFor = (node?: AnatomyNode) => {
    const resolved = resolveAnatomyPolicies(defaults, policyAncestors,
      node && node.kind !== "one_of" ? { id: node.id, overrides: node.policyOverrides } : undefined);
    return {
      missingRequired: resolved.missingRequired.value,
      unexpectedEntry: resolved.unexpectedEntry.value,
      nameMismatch: resolved.nameMismatch.value,
      nestingMismatch: resolved.nestingMismatch.value,
    };
  };
  const describe = (nodes: AnatomyNode[]) => nodes.map((node) => ({
    rulePath: registry.get(node.id)!.rulePath, node, policies: policiesFor(node),
    expectedName: node.kind === "one_of" ? null : node.name.type === "literal" ? node.name.value : node.name.value.replace(
      /<([^<>]+)>/, (placeholder, name: string) => result.captures[name] ?? placeholder,
    ),
  }));
  let nodes = definition.structure.root.children;
  result.rules = describe(nodes);

  for (const [index, part] of parts.entries()) {
    result.policies = policiesFor();
    result.rules = describe(nodes);
    const entries = nodes.flatMap((node) => node.kind === "one_of"
      ? node.alternatives.map((entry) => ({ node: entry, inGroup: true }))
      : [{ node, inGroup: false }]);
    const candidates = entries.flatMap(({ node, inGroup }) => {
      const exact = evaluateName(node, part, result.captures, result.bindings);
      const match = exact.kind === "none" && !inGroup
        ? evaluateName(node, part, result.captures, result.bindings, true) : exact;
      return match.kind === "none" ? [] : [{ node, match, caseMismatch: exact.kind === "none" }];
    });
    result.matches = candidates.map(({ node }) => registry.get(node.id)!.rulePath);
    if (candidates.length !== 1) {
      result.status = candidates.length === 0 ? QueryStatus.unmatched : QueryStatus.ambiguous;
      result.reason = candidates.length === 0
        ? `No declared entry matches "${part}" under ${result.scopePath}; the parent's unexpectedEntry policy still applies. Descendants are not checked.`
        : `Multiple rules may consume "${part}"; rule order, entry kind and sibling entries affect validation. Inspect the candidates before editing.`;
      return ok(result);
    }
    const candidate = candidates[0]!;
    const { node, match } = candidate;
    if (match.kind !== "match" || candidate.caseMismatch ||
        (index < parts.length - 1 && node.kind !== "directory")) {
      result.status = QueryStatus.mismatch;
      result.reason = candidate.caseMismatch ? "name_mismatch"
        : match.kind !== "match" ? match.kind : "nesting_mismatch";
      return ok(result);
    }
    for (const group of nodes) {
      if (group.kind === "one_of" && group.alternatives.some((entry) => entry.id === node.id)) {
        result.groups.push({
          rulePath: registry.get(group.id)!.rulePath,
          minimumMatches: group.minimumMatches, maximumMatches: group.maximumMatches,
          alternatives: group.alternatives.map((entry) => registry.get(entry.id)!.rulePath),
        });
      }
    }
    result.captures = { ...result.captures, ...match.captures };
    result.rules = describe([node]);
    result.policies = policiesFor(node);
    if (index === parts.length - 1) return ok(result);
    if (node.kind === "directory") {
      result.ancestors.push({
        rulePath: registry.get(node.id)!.rulePath, name: part,
        quantity: node.quantity, policies: result.policies,
      });
      policyAncestors.push({ id: node.id, overrides: node.policyOverrides });
      result.scopePath = parts.slice(0, index + 1).join("/");
      nodes = node.children;
    }
  }
  return ok(result);
};
