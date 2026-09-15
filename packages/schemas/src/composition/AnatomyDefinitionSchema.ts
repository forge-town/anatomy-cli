import { z } from "zod/v4";
import { AnatomyDraftInputSchema } from "../anatomy/AnatomyDraftInputSchema.js";
import { AnatomyStructureSchema } from "../anatomy/AnatomyStructureSchema.js";
import { AnatomyFileEntrySchema } from "../anatomy/AnatomyFileEntrySchema.js";
import { AnatomyRuleSchema } from "./AnatomyRuleSchema.js";
const base = AnatomyStructureSchema.omit({ rootMode: true, root: true });
const directory = AnatomyFileEntrySchema.omit({
  kind: true,
  exports: true,
}).extend({
  kind: z.literal("directory"),
  quantity: z.literal("exactly_one"),
  children: z.array(AnatomyRuleSchema),
});
export const AnatomyDefinitionSchema = AnatomyDraftInputSchema.omit({
  structure: true,
}).extend({
  structure: z.discriminatedUnion("rootMode", [
    base.extend({
      rootMode: z.literal("contents"),
      root: z.strictObject({ children: z.array(AnatomyRuleSchema) }),
    }),
    base.extend({
      rootMode: z.literal("entry"),
      root: directory,
    }),
  ]),
});
export type AnatomyDefinition = z.infer<typeof AnatomyDefinitionSchema>;
