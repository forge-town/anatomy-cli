import { z } from "zod/v4";

/** Compact Anatomy view used by lists and selectors. */
export const AnatomySummarySchema = z.object({
  /** Unique Anatomy identifier. */
  id: z.string(),
  /** Display name of the Anatomy. */
  name: z.string(),
  /** Intended purpose of the Anatomy. */
  purpose: z.string(),
  /** Archive timestamp, or null when the Anatomy is active. */
  archivedAt: z.date().nullable(),
  /** Creation timestamp. */
  createdAt: z.date(),
  /** Most recent update timestamp. */
  updatedAt: z.date(),
  /** Whether an editable draft exists. */
  hasDraft: z.boolean(),
  /** Latest published version number, or null when never published. */
  latestVersion: z.number().int().positive().nullable(),
  /** Number of current Crate references. */
  usageCount: z.number().int().nonnegative(),
});

export type AnatomySummary = z.infer<typeof AnatomySummarySchema>;
