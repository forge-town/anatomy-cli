import { z } from "zod/v4";

export const AnatomySourceExportsSchema = z.array(z.strictObject({
  name: z.string(),
  kind: z.enum(["function", "value"]),
}));

export type AnatomySourceExports = z.infer<typeof AnatomySourceExportsSchema>;
