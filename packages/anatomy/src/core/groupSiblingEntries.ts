import type { AnatomyEntry, AnatomyNode, AnatomyStructure } from "@anatomy-cli/schemas";
import { cloneEntry } from "./cloneEntry";
import { locateNodeInTree } from "./locateNodeInTree";
import { replaceNodeInTree } from "./replaceNodeInTree";
import { uid } from "./uid";

export const groupSiblingEntries = (
  root: AnatomyStructure,
  parentId: string | null,
  entryIds: string[],
): AnatomyStructure => {
  const targetParent =
    parentId === null
      ? root.root
      : (() => {
          const located = locateNodeInTree(root.root.children, parentId);

          return located.found && located.node.kind === "directory" ? located.node : null;
        })();

  if (!targetParent) return root;
  const children = targetParent.children;

  const entriesToGroup: AnatomyEntry[] = [];
  const remaining: AnatomyNode[] = [];

  for (const child of children) {
    if (entryIds.includes(child.id) && (child.kind === "file" || child.kind === "directory")) {
      entriesToGroup.push(child as AnatomyEntry);
    } else {
      remaining.push(child);
    }
  }

  if (entriesToGroup.length < 2) return root;

  const group: AnatomyNode = {
    id: uid(),
    kind: "one_of",
    minimumMatches: 1,
    maximumMatches: 1,
    alternatives: entriesToGroup.map((e) => cloneEntry(e)),
  };

  const newChildren = [...remaining, group];

  if (parentId === null) {
    return { ...root, root: { ...root.root, children: newChildren } };
  }

  const located = locateNodeInTree(root.root.children, parentId);
  if (!located.found || located.node.kind !== "directory") return root;

  const updated = cloneEntry(located.node);
  updated.children = newChildren;

  return replaceNodeInTree(root, located.node.id, updated);
};
