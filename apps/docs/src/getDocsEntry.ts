import { docsEntries } from "./docsEntries";

export const getDocsEntry = (slug: string) => docsEntries.find((entry) => entry.slug === slug);
