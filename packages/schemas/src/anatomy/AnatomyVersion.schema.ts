import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

/** Immutable historical snapshot of a published Anatomy definition. */
export const AnatomyVersionSchema = AnatomyDraftInputSchema.extend({
  /** Unique version record identifier. */
  id: z.string(),
  /** Identifier of the Anatomy that owns the version. */
  anatomyId: z.string(),
  /** Version number that increments within one Anatomy. */
  version: z.number().int().positive(),
  /** Publication timestamp for the version. */
  publishedAt: z.date(),
  /** Number of Crates currently referencing this version. */
  usageCount: z.number().int().nonnegative(),
});

export type AnatomyVersion = z.infer<typeof AnatomyVersionSchema>;
