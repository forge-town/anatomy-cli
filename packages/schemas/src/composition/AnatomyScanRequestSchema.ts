import { z } from "zod/v4";
import { AnatomyTargetSchema } from "./AnatomyTargetSchema.js";
export const AnatomyScanRequestSchema = z.strictObject({
  bundle: z.unknown(),
  target: AnatomyTargetSchema,
  coverage: z.discriminatedUnion("status", [
    z.strictObject({ status: z.literal("complete") }),
    z.strictObject({
      status: z.literal("incomplete"),
      reason: z.string(),
      paths: z.array(z.string()),
    }),
  ]),
  sources: z.record(z.string(), z.string()).optional(),
});
export type AnatomyScanRequest = z.infer<typeof AnatomyScanRequestSchema>;
