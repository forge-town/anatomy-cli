import { z } from "zod/v4";

import { AnatomyFileEntrySchema, type AnatomyFileEntry } from "./AnatomyFileEntrySchema.js";
import { AnatomyNodeSchema, type AnatomyNode } from "./AnatomyNodeSchema.js";

/** Directory node and its recursive children in an Anatomy tree. */
export const AnatomyDirectoryEntrySchema: z.ZodType<
  Omit<AnatomyFileEntry, "kind" | "exports"> & {
    kind: "directory";
    children: AnatomyNode[];
  }
> = z.lazy(() =>
  AnatomyFileEntrySchema.omit({ kind: true, exports: true }).extend({
    /** Node discriminant, fixed to directory. */
    kind: z.literal("directory"),
    /** Structure nodes directly contained by the directory. */
    children: z.array(AnatomyNodeSchema),
  }),
);

export type AnatomyDirectoryEntry = z.infer<typeof AnatomyDirectoryEntrySchema>;
