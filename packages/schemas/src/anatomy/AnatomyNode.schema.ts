import { z } from "zod/v4";

import { AnatomyEntrySchema, type AnatomyEntry } from "./AnatomyEntry.schema";
import { AnatomyOneOfGroupSchema, type AnatomyOneOfGroup } from "./AnatomyOneOfGroup.schema";

/** Any node permitted in an Anatomy tree, including entries and one-of groups. */
export const AnatomyNodeSchema: z.ZodType<AnatomyEntry | AnatomyOneOfGroup> = z.lazy(() =>
  z.union([AnatomyEntrySchema, AnatomyOneOfGroupSchema]),
);

export type AnatomyNode = z.infer<typeof AnatomyNodeSchema>;
