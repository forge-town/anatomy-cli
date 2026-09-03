import { z } from "zod/v4";

import { AnatomyBindingFormatSchema } from "./AnatomyBindingFormat.schema";

/** Constraints applied to values captured by a named Anatomy placeholder. */
export const AnatomyBindingSchema = z
  .object({
    /** Optional built-in naming convention. */
    format: AnatomyBindingFormatSchema.optional(),
    /** Optional JavaScript regular expression, evaluated as a full match. */
    pattern: z.string().trim().min(1).optional(),
  })
  .refine((binding) => binding.format !== undefined || binding.pattern !== undefined, {
    message: "A binding must define a format, a pattern, or both",
  })
  .refine(
    (binding) => {
      if (binding.pattern === undefined) return true;

      try {
        new RegExp(`^(?:${binding.pattern})$`);
        return true;
      } catch {
        return false;
      }
    },
    { path: ["pattern"], message: "Binding pattern must be a valid regular expression" },
  );

export type AnatomyBinding = z.infer<typeof AnatomyBindingSchema>;
