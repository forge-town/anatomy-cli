import { z } from "zod/v4";
import { AnatomyBundleSchema } from "./AnatomyBundleSchema.js";
import { AnatomyDiagnosticSchema } from "./AnatomyDiagnosticSchema.js";
export const AnatomyBundleValidationOutcomeSchema = z.discriminatedUnion(
  "status",
  [
    z.strictObject({ status: z.literal("valid"), bundle: AnatomyBundleSchema }),
    z.strictObject({
      status: z.literal("error"),
      diagnostics: z.array(AnatomyDiagnosticSchema),
    }),
  ],
);
export type AnatomyBundleValidationOutcome = z.infer<
  typeof AnatomyBundleValidationOutcomeSchema
>;
