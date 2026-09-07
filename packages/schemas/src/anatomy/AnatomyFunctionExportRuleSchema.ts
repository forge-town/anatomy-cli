import { z } from "zod/v4";
import { AnatomyNameExpressionSchema } from "./AnatomyNameExpressionSchema";
import { AnatomyPolicyValueSchema } from "./AnatomyPolicyValueSchema";

export const AnatomyFunctionExportRuleSchema = z.strictObject({
  name: z.union([z.literal("file_stem"), AnatomyNameExpressionSchema]),
  policy: AnatomyPolicyValueSchema.default("block"),
});

export type AnatomyFunctionExportRule = z.infer<typeof AnatomyFunctionExportRuleSchema>;
