import { z } from "zod/v4";

/** Literal or placeholder matching expression for an Anatomy entry name. */
export const AnatomyNameExpressionSchema = z.discriminatedUnion("type", [
  z.object({
    /** Expression type that requires an exact literal-name match. */
    type: z.literal("literal"),
    /** Literal filename that must match. */
    value: z.string().trim().min(1),
  }),
  z.object({
    /** Expression type that matches a semantic placeholder. */
    type: z.literal("placeholder"),
    /** Placeholder expression describing the permitted name. */
    value: z.string().trim().min(3),
  }),
]);

export type AnatomyNameExpression = z.infer<typeof AnatomyNameExpressionSchema>;
