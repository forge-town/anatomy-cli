import { z } from "zod/v4";
import { AnatomyOriginSchema } from "./AnatomyOriginSchema.js";
export const AnatomyMountSchema = z.strictObject({
  owner: AnatomyOriginSchema,
  ref: z.string(),
  mountPath: z.string(),
  captures: z.record(z.string(), z.string()),
});
export type AnatomyMount = z.infer<typeof AnatomyMountSchema>;
