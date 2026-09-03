import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInput.schema";

/** Input contract for saving an Anatomy draft. */
export const AnatomyDraftSaveInputSchema = AnatomyDraftInputSchema.extend({
  /** Expected draft revision used for optimistic concurrency control. */
  expectedRevision: z.number().int().positive(),
});

export type AnatomyDraftSaveInput = z.infer<typeof AnatomyDraftSaveInputSchema>;
