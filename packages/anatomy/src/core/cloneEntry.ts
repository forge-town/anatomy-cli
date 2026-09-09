import type { AnatomyEntry } from "@anatomy-cli/schemas";

export const cloneEntry = <T extends AnatomyEntry>(entry: T): T => {
  return JSON.parse(JSON.stringify(entry)) as T;
};
