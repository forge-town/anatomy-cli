import { z } from "zod/v4";

import { AnatomyEntrySchema, type AnatomyEntry } from "./AnatomyEntry.schema";

/** One-of group requiring a match count across multiple candidate entries. */
export const AnatomyOneOfGroupSchema: z.ZodType<{
  id: string;
  kind: "one_of";
  minimumMatches: number;
  maximumMatches: number;
  alternatives: AnatomyEntry[];
}> = z.object({
  /** Unique group identifier, generated during schema parsing when omitted. */
  id: z.string().uuid().default(() => crypto.randomUUID()),
  /** Node discriminant, fixed to one_of. */
  kind: z.literal("one_of"),
  /** Minimum number of alternatives that must match. */
  minimumMatches: z.number().int().min(1),
  /** Maximum number of alternatives allowed to match. */
  maximumMatches: z.number().int().min(1),
  /** Candidate file or directory entries available for matching. */
  alternatives: z.array(z.lazy(() => AnatomyEntrySchema)).min(2),
});

export type AnatomyOneOfGroup = z.infer<typeof AnatomyOneOfGroupSchema>;
