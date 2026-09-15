import { z } from "zod/v4";
import { AnatomyFileEntrySchema } from "../anatomy/AnatomyFileEntrySchema.js";
import { AnatomyOneOfGroupSchema } from "../anatomy/AnatomyOneOfGroupSchema.js";
import { AnatomyCompositionNodeSchema } from "./AnatomyCompositionNodeSchema.js";
const directory = AnatomyFileEntrySchema.omit({
  kind: true,
  exports: true,
}).extend({
  kind: z.literal("directory"),
  get children(): z.ZodArray<typeof AnatomyRuleSchema> {
    return z.array(AnatomyRuleSchema);
  },
});
export const AnatomyRuleSchema = z.union([
  AnatomyFileEntrySchema,
  directory,
  AnatomyOneOfGroupSchema,
  AnatomyCompositionNodeSchema,
]);
export type AnatomyRule = z.infer<typeof AnatomyRuleSchema>;
