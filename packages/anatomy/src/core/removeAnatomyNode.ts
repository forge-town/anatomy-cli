import type { AnatomyNode, AnatomyStructure } from "@anatomy-cli/schemas";
import { cloneEntry } from "./cloneEntry.js";
import { locateNodeInTree } from "./locateNodeInTree.js";
import { replaceNodeInTree } from "./replaceNodeInTree.js";

export const removeAnatomyNode = (root: AnatomyStructure, nodeId: string): AnatomyStructure => {
  const located = locateNodeInTree(root.root.children, nodeId);
  if (!located.found) return root;

  const { parent } = located;

  if (parent === null) {
    // Root-level node
    return {
      ...root,
      root: {
        ...root.root,
        children: root.root.children.filter((c) => c.id !== nodeId),
      },
    };
  }

  if (parent.kind === "one_of") {
    const updated: AnatomyNode = {
      ...parent,
      alternatives: parent.alternatives.filter((c) => c.id !== nodeId),
    };

    return replaceNodeInTree(root, parent.id, updated);
  }

  const updated = cloneEntry(parent);
  if (updated.kind !== "directory") return root;
  updated.children = updated.children.filter((c) => c.id !== nodeId);

  return replaceNodeInTree(root, parent.id, updated);
};
