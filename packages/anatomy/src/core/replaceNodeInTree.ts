import type { AnatomyNode, AnatomyStructure } from "@anatomy-cli/schemas";
import { updateAnatomyNode } from "./updateAnatomyNode";

export const replaceNodeInTree = (
  root: AnatomyStructure,
  nodeId: string,
  replacement: AnatomyNode,
): AnatomyStructure => {
  return updateAnatomyNode(root, nodeId, () => replacement);
};
