import { z } from "zod/v4";

import { AnatomyDraftInputSchema } from "./AnatomyDraftInputSchema.js";

/** Editable working draft of an Anatomy before publication. */
export const AnatomyDraftSchema = AnatomyDraftInputSchema.extend({
  /** Unique draft record identifier. */
  id: z.string(),

  /** Identifier of the Anatomy that owns the draft. */
  anatomyId: z.string(),
  /** Draft revision used for optimistic concurrency control. */
  revision: z.number().int().positive(),

  /** Draft creation timestamp. */
  createdAt: z.date(),
  /** Most recent draft save timestamp. */
  updatedAt: z.date(),
});

export type AnatomyDraft = z.infer<typeof AnatomyDraftSchema>;
