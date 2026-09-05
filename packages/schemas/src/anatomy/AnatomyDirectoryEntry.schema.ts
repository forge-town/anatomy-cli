import { z } from "zod/v4";

import { AnatomyFileEntrySchema, type AnatomyFileEntry } from "./AnatomyFileEntry.schema";
import { AnatomyNodeSchema, type AnatomyNode } from "./AnatomyNode.schema";

/** Directory node and its recursive children in an Anatomy tree. */
export const AnatomyDirectoryEntrySchema: z.ZodType<
  Omit<AnatomyFileEntry, "kind"> & {
    kind: "directory";
    children: AnatomyNode[];
  }
> = z.lazy(() =>
  AnatomyFileEntrySchema.omit({ kind: true }).extend({
    /** Node discriminant, fixed to directory. */
    kind: z.literal("directory"),
    /** Structure nodes directly contained by the directory. */
    children: z.array(AnatomyNodeSchema),
  }),
);

export type AnatomyDirectoryEntry = z.infer<typeof AnatomyDirectoryEntrySchema>;
