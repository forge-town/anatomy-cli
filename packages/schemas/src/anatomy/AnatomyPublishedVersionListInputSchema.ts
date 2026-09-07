import { z } from "zod/v4";

/** Input contract for querying a list of published Anatomy versions. */
export const AnatomyPublishedVersionListInputSchema = z.object({
  /** Search term used for fuzzy matching against version names or purposes. */
  search: z.string().trim().optional(),
  /** Identifier of the owning Anatomy. */
  anatomyId: z.string().optional(),
  /** One-based page number. */
  page: z.number().int().positive().optional(),
  /** Maximum number of versions returned per page. */
  pageSize: z.number().int().positive().max(100).optional(),
});

export type AnatomyPublishedVersionListInput = z.infer<
  typeof AnatomyPublishedVersionListInputSchema
>;
