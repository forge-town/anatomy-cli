import { z } from "zod/v4";
import { AnatomyDependencyConfigSchema } from "./AnatomyDependencyConfigSchema.js";

/** Complete virtual inventory and source text for a dependency-only scan. */
export const AnatomyDependencyRequestSchema = z.strictObject({
  /** Mounted definition's configuration. */
  config: AnatomyDependencyConfigSchema,
  /** Complete file inventory; files outside this inventory cannot be resolved. */
  files: z.array(z.string().min(1).refine((v) => !v.startsWith("/") && !/[\\\0:]/.test(v) && !v.split("/").some((p) => !p || p === "." || p === ".."))).max(100_000).refine((files) => new Set(files).size === files.length, "File inventory contains duplicates"),
  /** Source text keyed by scan-root-relative paths. No filesystem access occurs. */
  sources: z.record(z.string(), z.string()),
  /** Definition mount path; dot denotes the overall scan root. */
  scope: z.string().default(".").refine((v) => v === "." || (!v.startsWith("/") && !/[\\\0:]/.test(v) && !v.split("/").some((p) => !p || p === "." || p === ".."))),
});
export type AnatomyDependencyRequest = z.infer<typeof AnatomyDependencyRequestSchema>;
