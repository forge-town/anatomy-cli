import { z } from "zod/v4";
import { AnatomyDependencyIssueSchema } from "../anatomy/AnatomyDependencyIssueSchema.js";
import { AnatomyOriginSchema } from "./AnatomyOriginSchema.js";
import { AnatomyMountSchema } from "./AnatomyMountSchema.js";
import { AnatomyPolicyValueSchema } from "../anatomy/AnatomyPolicyValueSchema.js";
export const AnatomyFindingSchema = z.strictObject({
  /** Direct edge details when this is a dependency finding. */
  dependency: AnatomyDependencyIssueSchema.optional(),
  code: z.string(),
  severity: AnatomyPolicyValueSchema,
  message: z.string(),
  entryPath: z.string(),
  scopePath: z.string(),
  origin: AnatomyOriginSchema,
  mounts: z.array(AnatomyMountSchema),
  captures: z.record(z.string(), z.string()),
  policyOrigin: z.strictObject({
    origin: AnatomyOriginSchema,
    policy: z.string(),
  }),
  instanceKey: z.string(),
  issueKey: z.string(),
});
export type AnatomyFinding = z.infer<typeof AnatomyFindingSchema>;
