import { z } from "zod/v4";
import { AnatomyOriginSchema } from "./AnatomyOriginSchema.js";
export const AnatomyDiagnosticSchema = z.strictObject({
  code: z.enum([
    "invalid_bundle",
    "duplicate_definition_key",
    "missing_root",
    "unavailable_reference",
    "composition_cycle",
    "invalid_mount",
    "ambiguous_mount",
    "invalid_tree",
    "incomplete_tree",
    "source_unavailable",
    "source_analysis_error",
    "resource_limit_exceeded",
  ]),
  message: z.string(),
  entryPath: z.string().optional(),
  origin: AnatomyOriginSchema.optional(),
  chain: z.array(AnatomyOriginSchema).optional(),
});
export type AnatomyDiagnostic = z.infer<typeof AnatomyDiagnosticSchema>;
