import {
  AnatomyBundleQueryRequestSchema,
  type AnatomyBundleQueryOutcome,
  type AnatomyMount,
  type AnatomyRule,
} from "@anatomy-cli/schemas";
import { resolveAnatomyBundle } from "./resolveAnatomyBundle.js";
import { queryAnatomy } from "../core/queryAnatomy.js";
import { evaluateName } from "../core/evaluateName.js";
import { checkInputBudget } from "./checkInputBudget.js";

export const queryAnatomyBundle = (
  input: unknown,
): AnatomyBundleQueryOutcome => {
  const budget = checkInputBudget(input);
  if (budget.isErr())
    return {
      operation: "query",
      status: "error",
      diagnostics: [budget.error],
    };
  const request = AnatomyBundleQueryRequestSchema.safeParse(input);
  if (!request.success)
    return {
      operation: "query",
      status: "error",
      diagnostics: [{ code: "invalid_tree", message: request.error.message }],
    };
  const normalized = request.data.path.replaceAll("\\", "/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.split("/").includes("..")
  )
    return {
      operation: "query",
      status: "error",
      diagnostics: [
        { code: "invalid_tree", message: "Query must be a relative path" },
      ],
    };
  const targetName = request.data.targetName;
  if (
    targetName !== undefined &&
    (!targetName ||
      /[\\/\0]/.test(targetName) ||
      [".", ".."].includes(targetName) ||
      /^[A-Za-z]:/.test(targetName))
  )
    return {
      operation: "query",
      status: "error",
      diagnostics: [
        {
          code: "invalid_tree",
          message: "targetName must be a single segment",
        },
      ],
    };
  const resolved = resolveAnatomyBundle(request.data.bundle);
  if (resolved.isErr())
    return {
      operation: "query",
      status: "error",
      diagnostics: resolved.error,
    };
  const path =
    normalized
      .split("/")
      .filter((p) => p && p !== ".")
      .join("/") || ".";
  type Success = Exclude<AnatomyBundleQueryOutcome, { status: "error" }>;
  const walk = (
    key: string,
    remaining: string,
    name: string | undefined,
    base: string,
    mounts: AnatomyMount[],
  ): AnatomyBundleQueryOutcome => {
    const unit = resolved.value.compiled.get(key)!;
    const mapPath = (local: string) => {
      const relative =
        unit.entryRoot && name
          ? local === name || local === "."
            ? "."
            : local.slice(name.length + 1)
          : local;
      return relative === "."
        ? base
        : base === "."
          ? relative
          : `${base}/${relative}`;
    };
    const entryRoot = unit.compiledDefinition.structure.root.children[0];
    const rootRule: Success["rules"][number] = {
      origin: {
        definitionKey: key,
        rulePath: "/structure/root",
        sourceNodeId: unit.entryRoot
          ? unit.origins.get(
              unit.compiledDefinition.structure.root.children[0]!.id,
            )!.sourceNodeId
          : null,
      },
      ...(unit.entryRoot
        ? { node: unit.definition.structure.root as AnatomyRule }
        : {}),
      policies: {
        ...unit.compiledDefinition.structure.defaultPolicies,
        ...(unit.entryRoot && entryRoot?.kind === "directory"
          ? entryRoot.policyOverrides
          : {}),
      },
    };
    if (remaining === "." && (!unit.entryRoot || !name))
      return {
        operation: "query",
        status: "resolved",
        path,
        scopePath: base,
        reason: null,
        captures: {},
        mounts,
        rules: unit.entryRoot
          ? [rootRule]
          : [
              rootRule,
              ...unit.compiledDefinition.structure.root.children.map((n) => ({
                origin: unit.origins.get(n.id)!,
                node: unit.nodes.get(n.id)!,
                policies: {
                  ...unit.compiledDefinition.structure.defaultPolicies,
                  ...(n.kind === "one_of" ? {} : n.policyOverrides),
                },
              })),
            ],
      };
    if (unit.entryRoot && !name)
      return {
        operation: "query",
        status: "error",
        diagnostics: [
          {
            code: "invalid_tree",
            message:
              "targetName is required to query descendants of an entry root",
          },
        ],
      };
    const local = unit.entryRoot
      ? `${name}${remaining === "." ? "" : `/${remaining}`}`
      : remaining;
    const parts = local.split("/");
    for (let i = 0; i < parts.length; i++) {
      const prefix = parts.slice(0, i + 1).join("/");
      const query = queryAnatomy(unit.compiledDefinition, prefix, {
        skipValidation: true,
        matchName: (entry, actual, scope, bindings, ignoreCase) => {
          const mount = unit.mounts.get(entry.id);
          const child = mount
            ? resolved.value.compiled.get(mount.ref)
            : undefined;
          return child?.entryRoot
            ? evaluateName(
                entry,
                actual,
                {},
                child.compiledDefinition.structure.bindings ?? {},
                ignoreCase,
              )
            : evaluateName(entry, actual, scope, bindings, ignoreCase);
        },
      });
      if (query.isErr())
        return {
          operation: "query",
          status: "error",
          diagnostics: [
            { code: "invalid_bundle", message: "Unable to query definition" },
          ],
        };
      const q = query.value;
      const result: Success = {
        operation: "query",
        status: q.status,
        path,
        scopePath: mapPath(q.scopePath),
        reason: q.reason,
        captures: q.captures,
        mounts,
        rules: q.rules.map((r) => ({
          origin: unit.origins.get(r.node.id)!,
          node: unit.nodes.get(r.node.id)!,
          policies: r.policies,
        })),
      };
      if (q.status !== "resolved") return result;
      const matched = q.rules.length === 1 ? q.rules[0]?.node : undefined;
      const mount = matched ? unit.mounts.get(matched.id) : undefined;
      if (mount && matched) {
        const mountPath = mapPath(prefix);
        const frame = {
          owner: unit.origins.get(matched.id)!,
          ref: mount.ref,
          mountPath,
          captures: q.captures,
        };
        const child = walk(
          mount.ref,
          parts.slice(i + 1).join("/") || ".",
          parts[i],
          mountPath,
          [...mounts, frame],
        );
        if (i === parts.length - 1 && child.status !== "error")
          return { ...child, rules: [...result.rules, ...child.rules] };
        return child;
      }
      if (i === parts.length - 1) return result;
    }
    return {
      operation: "query",
      status: "resolved",
      path,
      scopePath: base,
      reason: null,
      captures: {},
      mounts,
      rules: [rootRule],
    };
  };
  return walk(resolved.value.bundle.root, path, targetName, ".", []);
};
