import { Result } from "neverthrow";
import { z } from "zod/v4";

import { AnatomyBindingFormatSchema } from "./AnatomyBindingFormat.schema";

const compilePattern = Result.fromThrowable(
  (pattern: string) => new RegExp(`^(?:${pattern})$`),
  () => undefined,
);

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

      return compilePattern(binding.pattern).isOk();
    },
    { path: ["pattern"], message: "Binding pattern must be a valid regular expression" },
  );

export type AnatomyBinding = z.infer<typeof AnatomyBindingSchema>;
