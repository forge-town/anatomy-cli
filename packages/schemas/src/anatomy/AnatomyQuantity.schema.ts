import { z } from "zod/v4";

/** Anatomy 文件或目录条目允许采用的数量约束。 */
export const AnatomyQuantitySchema = z.enum([
  "optional",
  "exactly_one",
  "one_or_more",
  "zero_or_more",
]);

export type AnatomyQuantity = z.infer<typeof AnatomyQuantitySchema>;
