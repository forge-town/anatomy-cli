import type { AnatomyNode, AnatomyStructure } from "@anatomy-cli/schemas";
import { cloneEntry } from "./cloneEntry";
import { locateNodeInTree } from "./locateNodeInTree";
import { replaceNodeInTree } from "./replaceNodeInTree";

export const insertAnatomyNode = (
  root: AnatomyStructure,
  parentId: string | null,
  node: AnatomyNode,
): AnatomyStructure => {
  if (parentId === null) {
    return {
      ...root,
      root: { ...root.root, children: [...root.root.children, node] },
    };
  }

  const located = locateNodeInTree(root.root.children, parentId);
  if (!located.found) return root;

  const targetNode = located.node;
  if (targetNode.kind !== "directory") return root;

  const updated = cloneEntry(targetNode);
  updated.children = [...updated.children, node];

  return replaceNodeInTree(root, targetNode.id, updated);
};
