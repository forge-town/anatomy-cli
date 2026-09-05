import { z } from "zod/v4";

import { AnatomyStructureSchema } from "./AnatomyStructure.schema";

/** Author-managed definition used to create or replace an Anatomy draft. */
export const AnatomyDraftInputSchema = z.object({
  /** Anatomy name displayed to users. */
  name: z.string().trim().min(1).max(120),
  /** Problem addressed by the structure contract and its intended purpose. */
  purpose: z.string().trim().max(2000),
  /** Recursive structure contract composed of files and directories. */
  structure: AnatomyStructureSchema,
});

export type AnatomyDraftInput = z.infer<typeof AnatomyDraftInputSchema>;
