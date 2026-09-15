import { z } from "zod/v4";

export const AnatomyOriginSchema = z.strictObject({
  definitionKey: z.string(),
  rulePath: z.string(),
  sourceNodeId: z.string().nullable(),
});
export type AnatomyOrigin = z.infer<typeof AnatomyOriginSchema>;
