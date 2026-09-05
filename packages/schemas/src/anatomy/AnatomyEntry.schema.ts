import { z } from "zod/v4";

import {
  AnatomyDirectoryEntrySchema,
  type AnatomyDirectoryEntry,
} from "./AnatomyDirectoryEntry.schema";
import { AnatomyFileEntrySchema, type AnatomyFileEntry } from "./AnatomyFileEntry.schema";

type AnatomyEntryValue = AnatomyFileEntry | AnatomyDirectoryEntry;

/** File or directory entry that maps directly to the filesystem. */
export const AnatomyEntrySchema: z.ZodType<AnatomyEntryValue> = z.lazy(() =>
  z.union([AnatomyFileEntrySchema, AnatomyDirectoryEntrySchema]),
);

export type AnatomyEntry = z.infer<typeof AnatomyEntrySchema>;
