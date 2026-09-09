import type { AnatomyEntry, AnatomyNode } from "@anatomy-cli/schemas";
import { type TreeNodeParent, locateNodeInTree } from "./locateNodeInTree";

type TreeNodeResult = { found: true; parent: TreeNodeParent; index: number } | { found: false };

export const findNodeInTree = (
  children: AnatomyNode[],
  nodeId: string,
  parent: (AnatomyEntry & { kind: "directory" }) | null = null,
): TreeNodeResult => {
  const located = locateNodeInTree(children, nodeId, parent);

  if (!located.found) return { found: false };

  return {
    found: true,
    parent: located.parent,
    index: located.index,
  };
};
