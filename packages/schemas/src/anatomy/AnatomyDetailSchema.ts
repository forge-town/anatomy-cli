import { z } from "zod/v4";

import { AnatomyDraftSchema } from "./AnatomyDraftSchema.js";

/** Complete Anatomy aggregate view, including its current draft and usage. */
export const AnatomyDetailSchema = z.object({
  /** Unique Anatomy identifier. */
  id: z.string(),

  /** Archive timestamp, or null when the Anatomy is active. */
  archivedAt: z.date().nullable(),
  /** Current editable draft, or null when no draft exists. */
  draft: AnatomyDraftSchema.nullable(),
  /** Number of current Crate references. */
  usageCount: z.number().int().nonnegative(),

  /** Creation timestamp. */
  createdAt: z.date(),
  /** Most recent update timestamp. */
  updatedAt: z.date(),
});

export type AnatomyDetail = z.infer<typeof AnatomyDetailSchema>;
