import { createAnatomyNodeId } from "./createAnatomyNodeId.js";
import { z } from "zod/v4";

import { AnatomyNameExpressionSchema } from "./AnatomyNameExpressionSchema.js";
import { AnatomyPolicyOverridesSchema } from "./AnatomyPolicyOverridesSchema.js";
import { AnatomyQuantitySchema } from "./AnatomyQuantitySchema.js";
import { AnatomyFunctionExportRuleSchema } from "./AnatomyFunctionExportRuleSchema.js";

/** File requirement with naming, quantity, and policy constraints. */
export const AnatomyFileEntrySchema = z.strictObject({
  /** Unique file-entry identifier, generated during schema parsing when omitted. */
  id: z.string().uuid().default(createAnatomyNodeId),
  /** Literal filename or placeholder expression. */
  name: AnatomyNameExpressionSchema,
  /** Allowed number of occurrences for the file. */
  quantity: AnatomyQuantitySchema,
  /** Local overrides for the default Anatomy policies. */
  policyOverrides: AnatomyPolicyOverridesSchema.default({}),
  /** Node discriminant, fixed to file. */
  kind: z.literal("file"),
  exports: AnatomyFunctionExportRuleSchema.optional(),
});

export type AnatomyFileEntry = z.infer<typeof AnatomyFileEntrySchema>;
