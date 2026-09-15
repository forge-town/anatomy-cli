import {
  AnatomyBundleSchema,
  type AnatomyDefinition,
  type AnatomyDiagnostic,
  type AnatomyRule,
  type AnatomyOrigin,
} from "@anatomy-cli/schemas";
import { err, ok, Result } from "neverthrow";
import { checkInputBudget } from "./checkInputBudget.js";
import { AnatomyResourceLimits } from "./AnatomyResourceLimits.js";
import { compileAnatomyDefinition } from "./compileAnatomyDefinition.js";
import { anatomyRulePaths } from "../core/anatomyRulePaths.js";
import { validateAnatomyForPublish } from "../core/validateAnatomyForPublish.js";

export const resolveAnatomyBundle = (input: unknown) => {
  const budget = checkInputBudget(input);
  if (budget.isErr()) return err([budget.error]);
  const parsed = Result.fromThrowable(
    () => AnatomyBundleSchema.safeParse(input),
    (): AnatomyDiagnostic => ({
      code: "invalid_bundle",
      message: "Bundle cannot be parsed",
    }),
  )();
  if (parsed.isErr()) return err([parsed.error]);
  if (!parsed.value.success) {
    return err<never, AnatomyDiagnostic[]>([
      {
        code: "invalid_bundle",
        message: parsed.value.error.message,
      },
    ]);
  }
  const bundle = parsed.value.data;
  const definitions = new Map<string, AnatomyDefinition>();
  const diagnostics: AnatomyDiagnostic[] = [];
  if (bundle.definitions.length > AnatomyResourceLimits.definitions)
    return err<never, AnatomyDiagnostic[]>([
      { code: "resource_limit_exceeded", message: "Too many definitions" },
    ]);
  for (const item of bundle.definitions) {
    if (definitions.has(item.key))
      diagnostics.push({
        code: "duplicate_definition_key",
        message: `Duplicate definition key ${item.key}`,
      });
    definitions.set(item.key, item.definition);
  }
  if (!definitions.has(bundle.root))
    diagnostics.push({
      code: "missing_root",
      message: `Missing root ${bundle.root}`,
    });
  const edges = new Map<string, { ref: string; origin: AnatomyOrigin }[]>();
  for (const [key, definition] of definitions) {
    const refs: { ref: string; origin: AnatomyOrigin }[] = [];
    const ids = new Set<string>();
    const visit = (node: AnatomyRule, path: string): void => {
      const origin = {
        definitionKey: key,
        rulePath: path,
        sourceNodeId: node.id ?? null,
      };
      if (ids.has(node.id))
        diagnostics.push({
          code: "invalid_bundle",
          message: "Duplicate node ID within definition",
          origin,
        });
      ids.add(node.id);
      if (
        node.kind !== "one_of" &&
        node.name &&
        (/[\\/\0]/.test(node.name.value) ||
          [".", ".."].includes(node.name.value) ||
          /^[A-Za-z]:/.test(node.name.value))
      )
        diagnostics.push({
          code: "invalid_mount",
          message: "Names must be single path segments",
          origin,
        });
      if (node.kind === "composition") {
        refs.push({ ref: node.ref, origin });
        const child = definitions.get(node.ref);
        if (child) {
          const entry = child.structure.rootMode === "entry";
          if (entry ? node.name !== undefined : node.name === undefined)
            diagnostics.push({
              code: "invalid_mount",
              message: entry
                ? "Entry references inherit the target root name"
                : "Contents references require a mount name",
              origin,
            });
        }
      }
      if (node.kind === "directory")
        node.children.forEach((n, i) => visit(n, `${path}/children/${i}`));
      if (node.kind === "one_of")
        node.alternatives.forEach((n, i) =>
          visit(n, `${path}/alternatives/${i}`),
        );
    };
    const structure = definition.structure;
    if (structure.rootMode === "entry")
      visit(structure.root, "/structure/root");
    else
      structure.root.children.forEach((n, i) =>
        visit(n, `/structure/root/children/${i}`),
      );
    edges.set(key, refs);
  }
  const active = new Set<string>();
  const heights = new Map<string, number>();
  const visitGraph = (key: string, chain: AnatomyOrigin[]): number => {
    if (chain.length > AnatomyResourceLimits.referenceDepth) {
      diagnostics.push({
        code: "resource_limit_exceeded",
        message: "Reference depth exceeded",
        chain,
      });
      return 0;
    }
    if (active.has(key)) {
      diagnostics.push({
        code: "composition_cycle",
        message: `Composition cycle reaches ${key}`,
        chain,
      });
      return 0;
    }
    if (heights.has(key)) return heights.get(key)!;
    active.add(key);
    let height = 0;
    for (const edge of edges.get(key) ?? []) {
      if (!definitions.has(edge.ref))
        diagnostics.push({
          code: "unavailable_reference",
          message: `Unavailable reference ${edge.ref}`,
          origin: edge.origin,
          chain: [...chain, edge.origin],
        });
      else
        height = Math.max(
          height,
          1 + visitGraph(edge.ref, [...chain, edge.origin]),
        );
    }
    active.delete(key);
    heights.set(key, height);
    return height;
  };
  if (visitGraph(bundle.root, []) > AnatomyResourceLimits.referenceDepth)
    diagnostics.push({
      code: "resource_limit_exceeded",
      message: "Reference depth exceeded",
    });
  if (diagnostics.length) return err(diagnostics);
  const compiled = new Map(
    [...definitions].map(([key, definition]) => [
      key,
      compileAnatomyDefinition(
        key,
        definition,
        definitions,
        (
          input as { definitions: { key: string; definition: unknown }[] }
        ).definitions.find((item) => item.key === key)?.definition,
      ),
    ]),
  );
  for (const [key, definition] of compiled) {
    // Unreachable missing references are not executable; only compile their locally defined shape.
    const validation = validateAnatomyForPublish(definition.compiledDefinition);
    const registry = anatomyRulePaths(definition.compiledDefinition);
    if (validation.isErr())
      for (const issue of validation.error.filter((issue) => {
        if (issue.code !== "duplicate_literal_name") return true;
        const node = registry.get(issue.nodeId)?.node;
        const parent = issue.parentId
          ? registry.get(issue.parentId)?.node
          : undefined;
        const siblings = !parent
          ? definition.compiledDefinition.structure.root.children
          : parent.kind === "one_of"
            ? parent.alternatives
            : parent.kind === "directory"
              ? parent.children
              : [];
        const same = siblings.filter(
          (sibling) =>
            node &&
            node.kind !== "one_of" &&
            sibling.kind !== "one_of" &&
            sibling.name.value === node.name.value,
        );
        return (
          !same.some((sibling) => definition.mounts.has(sibling.id)) ||
          same.filter((sibling) => !definition.mounts.has(sibling.id)).length >
            1
        );
      }))
        diagnostics.push({
          code: "invalid_bundle",
          message: issue.message,
          origin: definition.origins.get(issue.nodeId) ?? {
            definitionKey: key,
            rulePath: "/structure",
            sourceNodeId: null,
          },
        });
  }
  if (diagnostics.length) return err(diagnostics);
  return ok({ bundle, compiled });
};
export type ResolvedAnatomyBundle =
  ReturnType<typeof resolveAnatomyBundle> extends import("neverthrow").Result<
    infer T,
    unknown
  >
    ? T
    : never;
