import type { AnatomyEntry, AnatomyNode, AnatomyStructure } from "@anatomy-cli/schemas";

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
