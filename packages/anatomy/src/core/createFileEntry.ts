import type { AnatomyEntry, AnatomyQuantity } from "@anatomy-cli/schemas";
import { uid } from "./uid";

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
