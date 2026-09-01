import { z } from "zod/v4";

import { AnatomyEntrySchema, type AnatomyEntry } from "./AnatomyEntry.schema";
import { AnatomyOneOfGroupSchema, type AnatomyOneOfGroup } from "./AnatomyOneOfGroup.schema";

/** Anatomy 树允许出现的任意节点，包括条目和互斥组。 */
export const AnatomyNodeSchema: z.ZodType<AnatomyEntry | AnatomyOneOfGroup> = z.lazy(() =>
  z.union([AnatomyEntrySchema, AnatomyOneOfGroupSchema]),
);

export type AnatomyNode = z.infer<typeof AnatomyNodeSchema>;
