import { z } from "zod/v4";

/** Anatomy 定义所处的生命周期状态。 */
export const AnatomyStatusSchema = z.enum(["draft", "published", "archived"]);

export type AnatomyStatus = z.infer<typeof AnatomyStatusSchema>;
