import { z } from "zod/v4";
import { AnatomyNodeSchema } from "./AnatomyNode.schema";
import { AnatomyPolicyValueSchema } from "./AnatomyPolicyValue.schema";
import { AnatomySourceExportsSchema } from "./AnatomySourceExportsSchema";

export const AnatomyCheckWithDiagnosticsSchema = z.object({
  contractVersion: z.literal(1),
  operation: z.literal("check"),
  conforms: z.boolean(),
  summary: z.object({ block: z.number(), warn: z.number(), allow: z.number() }),
  issues: z.array(z.object({
    code: z.string(),
    severity: AnatomyPolicyValueSchema,
    path: z.string(),
    constraintId: z.string().nullable(),
    message: z.string(),
    expectedExport: z.string().optional(),
    actualExports: AnatomySourceExportsSchema.optional(),
    rulePath: z.string().nullable(),
    expected: AnatomyNodeSchema.nullable(),
    actual: z.array(z.object({ kind: z.enum(["file", "directory"]), name: z.string() })),
  })),
  definition: z.object({ path: z.string(), name: z.string(), schemaVersion: z.literal(1) }),
  targetPath: z.string(),
  ignoredNames: z.array(z.string()),
});

export type AnatomyCheckWithDiagnostics = z.infer<typeof AnatomyCheckWithDiagnosticsSchema>;
