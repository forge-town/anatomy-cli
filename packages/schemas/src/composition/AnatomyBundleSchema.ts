import { z } from "zod/v4";
import { AnatomyDefinitionSchema } from "./AnatomyDefinitionSchema.js";
export const AnatomyBundleSchema = z.strictObject({
  root: z.string().regex(/^[a-z][a-z0-9-]*$/),
  definitions: z
    .array(
      z.strictObject({
        key: z.string().regex(/^[a-z][a-z0-9-]*$/),
        definition: AnatomyDefinitionSchema,
      }),
    )
    .min(1),
});
export type AnatomyBundle = z.infer<typeof AnatomyBundleSchema>;
