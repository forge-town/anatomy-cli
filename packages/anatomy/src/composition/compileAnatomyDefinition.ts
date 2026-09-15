import type {
  AnatomyDefinition,
  AnatomyRule,
  AnatomyNode,
  AnatomyDraftInput,
  AnatomyOrigin,
  AnatomyCompositionNode,
} from "@anatomy-cli/schemas";

export const compileAnatomyDefinition = (
  key: string,
  definition: AnatomyDefinition,
  definitions: ReadonlyMap<string, AnatomyDefinition>,
  originalDefinition: unknown = definition,
) => {
  const origins = new Map<string, AnatomyOrigin>();
  const nodes = new Map<string, AnatomyRule>();
  const mounts = new Map<string, AnatomyCompositionNode>();
  let counter = 0;
  const convert = (node: AnatomyRule, path: string): AnatomyNode => {
    const id = `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
    let original: unknown = originalDefinition;
    for (const part of path.split("/").slice(1))
      original =
        original && typeof original === "object"
          ? (original as Record<string, unknown>)[part]
          : undefined;
    const sourceId =
      original && typeof original === "object"
        ? (original as { id?: unknown }).id
        : undefined;
    origins.set(id, {
      definitionKey: key,
      rulePath: path,
      sourceNodeId: typeof sourceId === "string" ? sourceId : null,
    });
    nodes.set(id, node);
    if (node.kind === "composition") {
      mounts.set(id, node);
      const root = definitions.get(node.ref)?.structure;
      const name =
        root?.rootMode === "entry"
          ? root.root.name
          : (node.name ?? { type: "literal", value: "unavailable" });
      return {
        kind: "directory",
        id,
        name,
        quantity: node.quantity,
        policyOverrides: node.policyOverrides,
        children: [],
      };
    }
    if (node.kind === "directory")
      return {
        ...node,
        id,
        children: node.children.map((child, i) =>
          convert(child, `${path}/children/${i}`),
        ),
      };
    if (node.kind === "one_of")
      return {
        ...node,
        id,
        alternatives: node.alternatives.map(
          (child, i) =>
            convert(child, `${path}/alternatives/${i}`) as Exclude<
              AnatomyNode,
              { kind: "one_of" }
            >,
        ),
      };
    return { ...node, id };
  };
  const structure = definition.structure;
  const entryRoot = structure.rootMode === "entry";
  const children = entryRoot
    ? [convert(structure.root, "/structure/root")]
    : structure.root.children.map((node, i) =>
        convert(node, `/structure/root/children/${i}`),
      );
  const compiledDefinition: AnatomyDraftInput = {
    name: definition.name,
    purpose: definition.purpose,
    structure: {
      rootMode: "contents",
      defaultPolicies: structure.defaultPolicies,
      bindings: structure.bindings,
      root: { children },
    },
  };
  return {
    key,
    definition,
    compiledDefinition,
    origins,
    nodes,
    mounts,
    entryRoot,
  };
};
export type CompiledAnatomyDefinition = ReturnType<
  typeof compileAnatomyDefinition
>;
