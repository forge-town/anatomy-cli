import { z } from "zod/v4";
const file = z.strictObject({
  kind: z.literal("file"),
  name: z.string().min(1),
});
export const AnatomyTargetSchema = z.strictObject({
  kind: z.literal("directory"),
  name: z.string().min(1),
  get children(): z.ZodArray<
    z.ZodUnion<[typeof file, typeof AnatomyTargetSchema]>
  > {
    return z.array(z.union([file, AnatomyTargetSchema]));
  },
});
export type AnatomyTarget = z.infer<typeof AnatomyTargetSchema>;
