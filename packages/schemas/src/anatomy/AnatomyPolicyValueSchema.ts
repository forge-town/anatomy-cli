import { z } from "zod/v4";

/** Action level available to Anatomy conformance checks. */
export const AnatomyPolicyValueSchema = z.enum(["block", "warn", "allow"]);

export type AnatomyPolicyValue = z.infer<typeof AnatomyPolicyValueSchema>;
