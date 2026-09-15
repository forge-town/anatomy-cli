import type {
  AnatomyFinding,
  AnatomyMount,
  AnatomyPolicies,
  AnatomyOrigin,
} from "@anatomy-cli/schemas";
import type {
  AnatomyCheckIssue,
  AnatomyPlanHooks,
} from "../core/planAnatomyCheck.js";
import type { CompiledAnatomyDefinition } from "./compileAnatomyDefinition.js";

export const createAnatomyFinding = (
  issue: AnatomyCheckIssue,
  unit: CompiledAnatomyDefinition,
  mounts: AnatomyMount[],
  mapPath: (path: string) => string,
  context: Parameters<NonNullable<AnatomyPlanHooks["onIssue"]>>[1],
): AnatomyFinding => {
  const root: AnatomyOrigin = {
    definitionKey: unit.key,
    rulePath: "/structure/root",
    sourceNodeId: null,
  };
  const ownerId = issue.constraintId ?? context.ancestors.at(-1)?.id;
  const origin = ownerId ? (unit.origins.get(ownerId) ?? root) : root;
  const rule = issue.constraintId
    ? unit.nodes.get(issue.constraintId)
    : undefined;
  const sourceExport = issue.code.startsWith("export_");
  let policyOrigin: AnatomyOrigin = {
    ...root,
    rulePath: "/structure/defaultPolicies",
  };
  for (const ancestor of context.ancestors) {
    if (ancestor.overrides[context.policyKey] !== undefined)
      policyOrigin = unit.origins.get(ancestor.id)!;
  }
  if (
    rule &&
    rule.kind !== "one_of" &&
    rule.policyOverrides[context.policyKey] !== undefined
  )
    policyOrigin = origin;
  if (sourceExport) policyOrigin = origin;
  const entryPath = mapPath(issue.path);
  const instanceKey = JSON.stringify([
    unit.key,
    mounts.map((m) => [
      m.owner.definitionKey,
      m.owner.rulePath,
      m.ref,
      m.mountPath,
    ]),
  ]);
  return {
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
    entryPath,
    scopePath: mapPath(context.parentPath),
    origin,
    mounts,
    captures: { ...context.scope },
    policyOrigin: {
      origin: policyOrigin,
      policy: sourceExport
        ? "exports"
        : (context.policyKey as keyof AnatomyPolicies),
    },
    instanceKey,
    issueKey: JSON.stringify([
      instanceKey,
      origin.rulePath,
      entryPath,
      issue.code,
    ]),
  };
};
