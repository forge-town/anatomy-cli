import { z } from "zod/v4";
import { AnatomyDiagnosticSchema } from "./AnatomyDiagnosticSchema.js";
import { AnatomyOriginSchema } from "./AnatomyOriginSchema.js";
import { AnatomyMountSchema } from "./AnatomyMountSchema.js";
import { AnatomyPoliciesSchema } from "../anatomy/AnatomyPoliciesSchema.js";
import { AnatomyRuleSchema } from "./AnatomyRuleSchema.js";
export const AnatomyBundleQueryOutcomeSchema = z.discriminatedUnion("status", [
  z.strictObject({
    operation: z.literal("query"),
    status: z.enum(["resolved", "unmatched", "ambiguous", "mismatch"]),
    path: z.string(),
    scopePath: z.string(),
    reason: z.string().nullable(),
    captures: z.record(z.string(), z.string()),
    mounts: z.array(AnatomyMountSchema),
    rules: z.array(
      z.strictObject({
        origin: AnatomyOriginSchema,
        node: AnatomyRuleSchema.optional(),
        policies: AnatomyPoliciesSchema,
      }),
    ),
  }),
  z.strictObject({
    operation: z.literal("query"),
    status: z.literal("error"),
    diagnostics: z.array(AnatomyDiagnosticSchema),
  }),
]);
export type AnatomyBundleQueryOutcome = z.infer<
  typeof AnatomyBundleQueryOutcomeSchema
>;
