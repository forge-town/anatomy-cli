import { z } from "zod/v4";

/** Local overrides of the default Anatomy policies for one structure entry. */
export const AnatomyPolicyOverridesSchema = z
  .object({
    /** Local action when a required entry is missing. */
    missingRequired: z.enum(["block", "warn", "allow"]),
    /** Local action when an undeclared entry is present. */
    unexpectedEntry: z.enum(["block", "warn", "allow"]),
    /** Local action when an entry name does not match. */
    nameMismatch: z.enum(["block", "warn", "allow"]),
    /** Local action when an entry is nested at the wrong location. */
    nestingMismatch: z.enum(["block", "warn", "allow"]),
  })
  .partial();

export type AnatomyPolicyOverrides = z.infer<typeof AnatomyPolicyOverridesSchema>;
