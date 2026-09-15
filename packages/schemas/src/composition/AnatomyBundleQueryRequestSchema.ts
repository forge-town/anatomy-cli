import { z } from "zod/v4";

export const AnatomyBundleQueryRequestSchema = z.strictObject({
  bundle: z.unknown(),
  path: z.string(),
  targetName: z.string().optional(),
});
export type AnatomyBundleQueryRequest = z.infer<
  typeof AnatomyBundleQueryRequestSchema
>;
