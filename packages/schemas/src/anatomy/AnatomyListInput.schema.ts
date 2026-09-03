import { z } from "zod/v4";

import { AnatomyStatusSchema } from "./AnatomyStatus.schema";

/** Input contract for paginated Anatomy list queries. */
export const AnatomyListInputSchema = z.object({
  /** Search term used for fuzzy matching against names or descriptions. */
  search: z.string().trim().optional(),
  /** Anatomy lifecycle status filter. */
  status: AnatomyStatusSchema.optional(),
  /** One-based page number. */
  page: z.number().int().positive().optional(),
  /** Maximum number of records returned per page. */
  pageSize: z.number().int().positive().max(100).optional(),
});

export type AnatomyListInput = z.infer<typeof AnatomyListInputSchema>;
