import { z } from "zod/v4";

import { AnatomyDraftSchema } from "./AnatomyDraft.schema";
import { AnatomyVersionSchema } from "./AnatomyVersion.schema";

/** Complete Anatomy aggregate view, including its draft, version history, and usage. */
export const AnatomyDetailSchema = z.object({
  /** Unique Anatomy identifier. */
  id: z.string(),

  /** Archive timestamp, or null when the Anatomy is active. */
  archivedAt: z.date().nullable(),
  /** Current editable draft, or null when no draft exists. */
  draft: AnatomyDraftSchema.nullable(),
  /** Immutable versions ordered by publication time. */
  versions: z.array(AnatomyVersionSchema),
  /** Number of current Crate references. */
  usageCount: z.number().int().nonnegative(),

  /** Creation timestamp. */
  createdAt: z.date(),
  /** Most recent update timestamp. */
  updatedAt: z.date(),
});

export type AnatomyDetail = z.infer<typeof AnatomyDetailSchema>;
