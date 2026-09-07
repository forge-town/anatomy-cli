import type { AnatomyEntry, AnatomyNode, AnatomyQuantity } from "@anatomy-cli/schemas";
import { uid } from "./uid";

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
