import { z } from "zod/v4";

/** Quantity constraint available to Anatomy file or directory entries. */
export const AnatomyQuantitySchema = z.enum([
  "optional",
  "exactly_one",
  "one_or_more",
  "zero_or_more",
]);

export type AnatomyQuantity = z.infer<typeof AnatomyQuantitySchema>;
