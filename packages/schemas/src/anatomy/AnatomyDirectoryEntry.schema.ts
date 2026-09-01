import { z } from "zod/v4";

import { AnatomyFileEntrySchema, type AnatomyFileEntry } from "./AnatomyFileEntry.schema";
import { AnatomyNodeSchema, type AnatomyNode } from "./AnatomyNode.schema";

/** Anatomy 树中的目录节点及其递归子节点。 */
export const AnatomyDirectoryEntrySchema: z.ZodType<
  Omit<AnatomyFileEntry, "kind"> & {
    kind: "directory";
    children: AnatomyNode[];
  }
> = z.lazy(() =>
  AnatomyFileEntrySchema.omit({ kind: true }).extend({
    /** 节点判别字段，固定为目录。 */
    kind: z.literal("directory"),
    /** 目录直接包含的结构节点。 */
    children: z.array(AnatomyNodeSchema),
  }),
);

export type AnatomyDirectoryEntry = z.infer<typeof AnatomyDirectoryEntrySchema>;
