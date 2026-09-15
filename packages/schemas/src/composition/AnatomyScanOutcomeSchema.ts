import { z } from "zod/v4";
import { AnatomyDiagnosticSchema } from "./AnatomyDiagnosticSchema.js";
import { AnatomyFindingSchema } from "./AnatomyFindingSchema.js";
export const AnatomyScanOutcomeSchema = z.discriminatedUnion("status", [
  z.strictObject({
    operation: z.literal("check"),
    status: z.literal("completed"),
    conforms: z.boolean(),
    summary: z.strictObject({
      block: z.number(),
      warn: z.number(),
      allow: z.number(),
    }),
    issues: z.array(AnatomyFindingSchema),
  }),
  z.strictObject({
    operation: z.literal("check"),
    status: z.literal("error"),
    conforms: z.null(),
    diagnostics: z.array(AnatomyDiagnosticSchema),
  }),
]);
export type AnatomyScanOutcome = z.infer<typeof AnatomyScanOutcomeSchema>;
