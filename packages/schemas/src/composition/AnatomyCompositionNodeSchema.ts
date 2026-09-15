import { z } from "zod/v4";
import { AnatomyFileEntrySchema } from "../anatomy/AnatomyFileEntrySchema.js";
export const AnatomyCompositionNodeSchema = AnatomyFileEntrySchema.omit({
  kind: true,
  exports: true,
  name: true,
}).extend({
  kind: z.literal("composition"),
  ref: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: AnatomyFileEntrySchema.shape.name.optional(),
});
export type AnatomyCompositionNode = z.infer<
  typeof AnatomyCompositionNodeSchema
>;
