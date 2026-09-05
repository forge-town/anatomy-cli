import { z } from "zod/v4";
import { AnatomyPolicyValueSchema } from "./AnatomyPolicyValue.schema";

/** Default policies applied when a Crate does not conform to an Anatomy. */
export const AnatomyPoliciesSchema = z.object({
  /** Default action when a required entry is missing. */
  missingRequired: AnatomyPolicyValueSchema,
  /** Default action when an undeclared entry is present. */
  unexpectedEntry: AnatomyPolicyValueSchema,
  /** Default action when an entry name does not match. */
  nameMismatch: AnatomyPolicyValueSchema,
  /** Default action when an entry is nested at the wrong location. */
  nestingMismatch: AnatomyPolicyValueSchema,
});

/** Default Anatomy policy values. */
export type AnatomyPolicies = z.infer<typeof AnatomyPoliciesSchema>;
