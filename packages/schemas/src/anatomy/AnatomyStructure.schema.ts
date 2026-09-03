import { z } from "zod/v4";

import { AnatomyPoliciesSchema } from "./AnatomyPolicy.schema";
import { AnatomyNodeSchema } from "./AnatomyNode.schema";
import { AnatomyBindingSchema } from "./AnatomyBinding.schema";

/** Recursive filesystem structure contract that an Anatomy must satisfy. */
export const AnatomyStructureSchema = z.object({
  /** Structure document format version used for future-compatible migrations. */
  schemaVersion: z.literal(1),
  /** Default policies used by nodes that do not provide local overrides. */
  defaultPolicies: AnatomyPoliciesSchema,
  /** Named placeholder constraints shared by matching descendants. */
  bindings: z
    .record(
      z
        .string()
        .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Binding names must be identifier-like"),
      AnatomyBindingSchema,
    )
    .optional(),
  /** Virtual root node that does not represent a real directory. */
  root: z.object({
    /** Structure nodes at the top level of the Anatomy. */
    children: z.array(AnatomyNodeSchema),
  }),
});

export type AnatomyStructure = z.infer<typeof AnatomyStructureSchema>;
