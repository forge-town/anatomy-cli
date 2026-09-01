import { z } from "zod/v4";

/** Anatomy 一致性检查可采用的处置等级。 */
export const AnatomyPolicyValueSchema = z.enum(["block", "warn", "allow"]);

export type AnatomyPolicyValue = z.infer<typeof AnatomyPolicyValueSchema>;
