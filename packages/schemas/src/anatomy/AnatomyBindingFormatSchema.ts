import { z } from "zod/v4";

/** Built-in naming conventions supported by Anatomy placeholder bindings. */
export const AnatomyBindingFormatSchema = z.enum([
  "PascalCase",
  "camelCase",
  "kebab-case",
  "snake_case",
  "SCREAMING_SNAKE_CASE",
]);

export type AnatomyBindingFormat = z.infer<typeof AnatomyBindingFormatSchema>;
