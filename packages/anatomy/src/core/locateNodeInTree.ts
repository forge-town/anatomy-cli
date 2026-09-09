import type { AnatomyEntry, AnatomyNode } from "@anatomy-cli/schemas";

export type TreeNodeParent =
  | (AnatomyEntry & { kind: "directory" })
  | Extract<AnatomyNode, { kind: "one_of" }>
  | null;

type LocatedNode =
  | { found: true; node: AnatomyNode; parent: TreeNodeParent; index: number }
  | { found: false };

export const locateNodeInTree = (
  children: AnatomyNode[],
  nodeId: string,
  parent: TreeNodeParent = null,
): LocatedNode => {
  for (const [i, child] of children.entries()) {
    if (child.id === nodeId) {
      return { found: true, node: child, parent, index: i };
    }

    if (child.kind === "directory") {
      const result = locateNodeInTree(child.children, nodeId, child);
      if (result.found) return result;
    }

    if (child.kind === "one_of") {
      for (const [j, alt] of child.alternatives.entries()) {
        if (alt.id === nodeId) {
          return { found: true, node: alt, parent: child, index: j };
        }

        if (alt.kind === "directory") {
          const result = locateNodeInTree(alt.children, nodeId, alt);
          if (result.found) return result;
        }
      }
    }
  }

  return { found: false };
};
