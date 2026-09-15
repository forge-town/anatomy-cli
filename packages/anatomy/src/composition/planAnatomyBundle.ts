import {
  AnatomyScanRequestSchema,
  type AnatomyDiagnostic,
  type AnatomyFinding,
  type AnatomyMount,
  type AnatomyTarget,
  type AnatomyFunctionExportCheck,
  type AnatomyEntry,
} from "@anatomy-cli/schemas";
import { err, ok } from "neverthrow";
import { resolveAnatomyBundle } from "./resolveAnatomyBundle.js";
import { checkInputBudget } from "./checkInputBudget.js";
import { AnatomyResourceLimits } from "./AnatomyResourceLimits.js";
import { createAnatomyFinding } from "./createAnatomyFinding.js";
import {
  planAnatomyCheck,
  type AnatomyPlanHooks,
  type AnatomyCheckIssue,
} from "../core/planAnatomyCheck.js";
import { evaluateName } from "../core/evaluateName.js";

type ExportPlan = {
  check: AnatomyFunctionExportCheck;
  finding: (issue: AnatomyCheckIssue) => AnatomyFinding;
};
export const planAnatomyBundle = (input: unknown) => {
  const budget = checkInputBudget(input);
  if (budget.isErr()) return err([budget.error]);
  const parsed = AnatomyScanRequestSchema.safeParse(input);
  if (!parsed.success)
    return err<never, AnatomyDiagnostic[]>([
      { code: "invalid_tree", message: parsed.error.message },
    ]);
  const request = parsed.data;
  if (request.coverage.status !== "complete")
    return err<never, AnatomyDiagnostic[]>([
      { code: "incomplete_tree", message: request.coverage.reason },
    ]);
  const diagnostics: AnatomyDiagnostic[] = [];
  const validateTree = (target: AnatomyTarget): void => {
    const names = new Set<string>();
    for (const entry of [target, ...target.children]) {
      if (
        !entry.name ||
        /[\\/\0]/.test(entry.name) ||
        [".", ".."].includes(entry.name) ||
        /^[A-Za-z]:/.test(entry.name)
      )
        diagnostics.push({
          code: "invalid_tree",
          message: "Names must be single path segments",
        });
    }
    for (const entry of target.children) {
      if (names.has(entry.name))
        diagnostics.push({
          code: "invalid_tree",
          message: `Duplicate sibling ${entry.name}`,
        });
      names.add(entry.name);
      if (entry.kind === "directory") validateTree(entry);
    }
    target.children.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
  };
  validateTree(request.target);
  let totalBytes = 0;
  for (const [path, source] of Object.entries(request.sources ?? {})) {
    if (
      path.startsWith("/") ||
      /[\\\0]/.test(path) ||
      /^[A-Za-z]:/.test(path) ||
      path.split("/").some((p) => !p || p === ".." || p === ".")
    )
      diagnostics.push({
        code: "invalid_tree",
        message: "Source paths must be relative POSIX paths",
      });
    const bytes = new TextEncoder().encode(source).length;
    totalBytes += bytes;
    if (bytes > AnatomyResourceLimits.sourceBytes)
      diagnostics.push({
        code: "resource_limit_exceeded",
        message: "Source file exceeds byte limit",
        entryPath: path,
      });
  }
  if (totalBytes > AnatomyResourceLimits.totalSourceBytes)
    diagnostics.push({
      code: "resource_limit_exceeded",
      message: "Source collection exceeds byte limit",
    });
  if (diagnostics.length) return err(diagnostics);
  const resolved = resolveAnatomyBundle(request.bundle);
  if (resolved.isErr()) return err(resolved.error);
  const issues: AnatomyFinding[] = [];
  const exports: ExportPlan[] = [];
  let instances = 0;
  const walk = (
    key: string,
    target: AnatomyTarget,
    base: string,
    mounts: AnatomyMount[],
  ): void => {
    if (diagnostics.length) return;
    if (++instances > AnatomyResourceLimits.mounts) {
      diagnostics.push({
        code: "resource_limit_exceeded",
        message: "Mount instance limit exceeded",
      });
      return;
    }
    const unit = resolved.value.compiled.get(key)!;
    const mapPath = (path: string) => {
      const relative = unit.entryRoot
        ? path === target.name || path === "."
          ? "."
          : path.slice(target.name.length + 1)
        : path;
      return relative === "."
        ? base
        : base === "."
          ? relative
          : `${base}/${relative}`;
    };
    const contexts = new Map<
      string,
      Parameters<NonNullable<AnatomyPlanHooks["onIssue"]>>[1]
    >();
    const matchName: NonNullable<AnatomyPlanHooks["matchName"]> = (
      entry,
      name,
      scope,
      ignoreCase,
    ) => {
      const mount = unit.mounts.get(entry.id);
      if (mount) {
        const child = resolved.value.compiled.get(mount.ref)!;
        if (child.entryRoot)
          return evaluateName(
            entry,
            name,
            {},
            child.compiledDefinition.structure.bindings ?? {},
            ignoreCase,
          );
      }
      return evaluateName(
        entry,
        name,
        scope,
        unit.compiledDefinition.structure.bindings ?? {},
        ignoreCase,
      );
    };
    const hooks: AnatomyPlanHooks = {
      preferKindOwner: true,
      matchName,
      skipValidation: true,
      onLevel: (nodes, actual, path, scope) => {
        const entries = nodes.flatMap((n) =>
          n.kind === "one_of" ? n.alternatives : [n],
        );
        for (const entry of actual) {
          const candidates = entries.filter(
            (n) =>
              n.kind === entry.kind &&
              (matchName(n, entry.name, scope, false).kind !== "none" ||
                matchName(n, entry.name, scope, true).kind !== "none"),
          );
          if (
            candidates.length > 1 &&
            candidates.some((n) => unit.mounts.has(n.id))
          ) {
            diagnostics.push({
              code: "ambiguous_mount",
              message: `Multiple owners for ${mapPath(path === "." ? entry.name : `${path}/${entry.name}`)}`,
              entryPath: mapPath(
                path === "." ? entry.name : `${path}/${entry.name}`,
              ),
              chain: candidates.map((n) => unit.origins.get(n.id)!),
            });
            return false;
          }
        }
        return diagnostics.length === 0;
      },
      onIssue: (issue, context) =>
        issues.push(
          createAnatomyFinding(issue, unit, mounts, mapPath, context),
        ),
      onMatch: (entry, path, scope) =>
        contexts.set(`${entry.id}:${path}`, {
          parentPath: path.includes("/")
            ? path.slice(0, path.lastIndexOf("/"))
            : ".",
          ancestors: [],
          scope,
          policyKey: "unexpectedEntry",
        }),
      onDirectory: (entry, actual, path, scope) => {
        const mount = unit.mounts.get(entry.id);
        if (!mount) return true;
        const child = resolved.value.compiled.get(mount.ref)!;
        const ownMatch = evaluateName(
          entry,
          actual.name,
          child.entryRoot ? {} : scope,
          child.entryRoot
            ? (child.compiledDefinition.structure.bindings ?? {})
            : (unit.compiledDefinition.structure.bindings ?? {}),
        );
        walk(mount.ref, actual, mapPath(path), [
          ...mounts,
          {
            owner: unit.origins.get(entry.id)!,
            ref: mount.ref,
            mountPath: mapPath(path),
            captures:
              ownMatch.kind === "match"
                ? { ...scope, ...ownMatch.captures }
                : { ...scope },
          },
        ]);
        return false;
      },
    };
    if (unit.entryRoot) {
      const root = unit.compiledDefinition.structure.root
        .children[0] as AnatomyEntry;
      const match = evaluateName(
        root,
        target.name,
        {},
        unit.compiledDefinition.structure.bindings ?? {},
      );
      if (match.kind !== "match") {
        issues.push(
          createAnatomyFinding(
            {
              code: match.kind === "none" ? "name_mismatch" : match.kind,
              severity:
                root.policyOverrides.nameMismatch ??
                unit.compiledDefinition.structure.defaultPolicies.nameMismatch,
              path: target.name,
              constraintId: root.id,
              message: `Target root ${target.name} does not match ${root.name.value}`,
            },
            unit,
            mounts,
            mapPath,
            {
              parentPath: ".",
              ancestors: [],
              scope: {},
              policyKey: "nameMismatch",
            },
          ),
        );
        return;
      }
    }
    const plan = planAnatomyCheck(
      unit.compiledDefinition,
      unit.entryRoot ? [target] : target.children,
      hooks,
    );
    if (plan.isErr()) {
      diagnostics.push({
        code: "invalid_bundle",
        message: plan.error.map((i) => i.message).join("; "),
      });
      return;
    }
    for (const check of plan.value.exportChecks) {
      const context = contexts.get(`${check.constraintId}:${check.path}`)!;
      exports.push({
        check: { ...check, path: mapPath(check.path) },
        finding: (issue) =>
          createAnatomyFinding(
            { ...issue, path: check.path },
            unit,
            mounts,
            mapPath,
            context,
          ),
      });
    }
  };
  walk(resolved.value.bundle.root, request.target, ".", []);
  if (diagnostics.length) return err(diagnostics);
  return ok({ issues, exports, sources: request.sources ?? {} });
};
export type AnatomyBundlePlan = ReturnType<typeof planAnatomyBundle>;
