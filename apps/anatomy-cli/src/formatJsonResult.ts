import type { AnatomyCheckResult } from "@anatomy-cli/anatomy/core";

export const formatJsonResult = (result: AnatomyCheckResult): string => {
  return JSON.stringify(result, null, 2);
};
