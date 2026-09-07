import { z } from "zod/v4";

/** Lifecycle status of an Anatomy definition. */
export const AnatomyStatusSchema = z.enum(["draft", "published", "archived"]);

export type AnatomyStatus = z.infer<typeof AnatomyStatusSchema>;
