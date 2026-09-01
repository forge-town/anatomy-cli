import { z } from "zod/v4";

import {
  AnatomyDirectoryEntrySchema,
  type AnatomyDirectoryEntry,
} from "./AnatomyDirectoryEntry.schema";
import { AnatomyFileEntrySchema, type AnatomyFileEntry } from "./AnatomyFileEntry.schema";

type AnatomyEntryValue = AnatomyFileEntry | AnatomyDirectoryEntry;

/** Anatomy 树中可直接落在文件系统上的文件或目录条目。 */
export const AnatomyEntrySchema: z.ZodType<AnatomyEntryValue> = z.lazy(() =>
  z.union([AnatomyFileEntrySchema, AnatomyDirectoryEntrySchema]),
);

export type AnatomyEntry = z.infer<typeof AnatomyEntrySchema>;
