import { z } from "zod/v4";
import { AnatomyPolicyValueSchema } from "./AnatomyPolicyValueSchema";

export const AnatomyFunctionExportCheckSchema = z.strictObject({
  path: z.string(),
  constraintId: z.string(),
  expectedName: z.string(),
  policy: AnatomyPolicyValueSchema,
});

export type AnatomyFunctionExportCheck = z.infer<typeof AnatomyFunctionExportCheckSchema>;
