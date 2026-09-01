import type { AnatomyNode, AnatomyEntry, AnatomyStructure, AnatomyQuantity } from "@anatomy-cli/schemas";

// ---- helpers ----

const uid = (() => {
  const state = { counter: 0 };

  return (): string => {
    state.counter += 1;

    return crypto.randomUUID?.() ?? `node-${state.counter}-${Date.now()}`;
  };
})();

const cloneEntry = <T extends AnatomyEntry>(entry: T): T => {
  return JSON.parse(JSON.stringify(entry)) as T;
};

// ---- factory functions ----

export const createFileEntry = (
  name: string,
  quantity?: AnatomyQuantity,
): AnatomyEntry & { kind: "file" } => {
  return {
    id: uid(),
    kind: "file",
    name: { type: "literal", value: name },
    quantity: quantity ?? "optional",
    policyOverrides: {},
  };
};

export const createDirectoryEntry = (
  name: string,
  children: AnatomyNode[] = [],
  quantity?: AnatomyQuantity,
): AnatomyEntry & { kind: "directory" } => {
  return {
    id: uid(),
    kind: "directory",
    name: { type: "literal", value: name },
    quantity: quantity ?? "optional",
    policyOverrides: {},
    children,
  };
};

// ---- tree queries ----

type TreeNodeParent =
  | (AnatomyEntry & { kind: "directory" })
  | Extract<AnatomyNode, { kind: "one_of" }>
  | null;

type TreeNodeResult = { found: true; parent: TreeNodeParent; index: number } | { found: false };

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

// ---- tree mutations (immutable) ----

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

export const updateAnatomyNode = (
  root: AnatomyStructure,
  nodeId: string,
  updater: (node: AnatomyNode) => AnatomyNode,
): AnatomyStructure => {
  // Check root children
  const rootIdx = root.root.children.findIndex((c) => c.id === nodeId);
  if (rootIdx !== -1) {
    const updated = root.root.children.map((c, i) => (i === rootIdx ? updater(c) : c));

    return { ...root, root: { ...root.root, children: updated } };
  }

  // Recurse
  const recurse = (children: AnatomyNode[]): AnatomyNode[] => {
    return children.map((child) => {
      if (child.id === nodeId) return updater(child);

      if (child.kind === "directory") {
        return { ...child, children: recurse(child.children) };
      }

      if (child.kind === "one_of") {
        return {
          ...child,
          alternatives: child.alternatives.map((alt) => {
            if (alt.id === nodeId) {
              const updated = updater(alt as AnatomyNode);
              // Alternatives must remain entries (file or directory)
              return updated.kind === "one_of" ? alt : (updated as AnatomyEntry);
            }

            if (alt.kind === "directory") {
              return { ...alt, children: recurse(alt.children) };
            }

            return alt;
          }),
        };
      }

      return child;
    });
  };

  return {
    ...root,
    root: { ...root.root, children: recurse(root.root.children) },
  };
};

const replaceNodeInTree = (
  root: AnatomyStructure,
  nodeId: string,
  replacement: AnatomyNode,
): AnatomyStructure => {
  return updateAnatomyNode(root, nodeId, () => replacement);
};

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

// ---- default structure ----

export const createEmptyStructure = (): AnatomyStructure => {
  return {
    schemaVersion: 1,
    defaultPolicies: {
      missingRequired: "block",
      unexpectedEntry: "warn",
      nameMismatch: "warn",
      nestingMismatch: "block",
    },
    root: { children: [] },
  };
};
