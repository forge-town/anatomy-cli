import { z } from "zod/v4";

import { AnatomyNameExpressionSchema } from "./AnatomyNameExpression.schema";
import { AnatomyPolicyOverridesSchema } from "./AnatomyPolicyOverrides.schema";
import { AnatomyQuantitySchema } from "./AnatomyQuantity.schema";

/** File requirement with naming, quantity, and policy constraints. */
export const AnatomyFileEntrySchema = z.object({
  /** Unique file-entry identifier, generated during schema parsing when omitted. */
  id: z.string().uuid().default(() => crypto.randomUUID()),
  /** Literal filename or placeholder expression. */
  name: AnatomyNameExpressionSchema,
  /** Allowed number of occurrences for the file. */
  quantity: AnatomyQuantitySchema,
  /** Local overrides for the default Anatomy policies. */
  policyOverrides: AnatomyPolicyOverridesSchema.default({}),
  /** Node discriminant, fixed to file. */
  kind: z.literal("file"),
});

export type AnatomyFileEntry = z.infer<typeof AnatomyFileEntrySchema>;
