import { analyzeSourceExports as analyze } from "@anatomy-cli/anatomy/source";
export const analyzeSourceExports = (path: string, content: string) => analyze(path, content);
