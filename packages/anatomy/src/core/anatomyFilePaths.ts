import type { AnatomyFileTreeEntry } from "./planAnatomyCheck.js";

export const anatomyFilePaths = (tree: AnatomyFileTreeEntry[]): string[] => {
  const paths: string[] = [];
  const walk = (entries: AnatomyFileTreeEntry[], parent: string): void => {
    for (const entry of entries) {
      const path = parent ? `${parent}/${entry.name}` : entry.name;
      if (entry.kind === "file") paths.push(path);
      else walk(entry.children, path);
    }
  };
  walk(tree, "");
  return paths.sort();
};
