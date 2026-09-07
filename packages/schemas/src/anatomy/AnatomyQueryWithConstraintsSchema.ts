import { z } from "zod/v4";
import { AnatomyNodeSchema } from "./AnatomyNode.schema";
import { AnatomyPoliciesSchema } from "./AnatomyPolicy.schema";
import { AnatomyBindingSchema } from "./AnatomyBinding.schema";
import { AnatomyQuantitySchema } from "./AnatomyQuantity.schema";

export const AnatomyQueryWithConstraintsSchema = z.object({
  contractVersion: z.literal(1),
  operation: z.literal("query"),
  path: z.string(),
  scopePath: z.string(),
  status: z.enum(["resolved", "unmatched", "ambiguous", "mismatch"]),
  reason: z.string().nullable(),
  captures: z.record(z.string(), z.string()),
  bindings: z.record(z.string(), AnatomyBindingSchema),
  policies: AnatomyPoliciesSchema,
  ancestors: z.array(z.object({
    rulePath: z.string(),
    name: z.string(),
    quantity: AnatomyQuantitySchema,
    policies: AnatomyPoliciesSchema,
  })),
  rules: z.array(z.object({
    rulePath: z.string(),
    node: AnatomyNodeSchema,
    expectedName: z.string().nullable(),
    expectedExport: z.string().optional(),
    policies: AnatomyPoliciesSchema,
  })),
  matches: z.array(z.string()),
  groups: z.array(z.object({
    rulePath: z.string(),
    minimumMatches: z.number(),
    maximumMatches: z.number(),
    alternatives: z.array(z.string()),
  })),
});

export type AnatomyQueryWithConstraints = z.infer<typeof AnatomyQueryWithConstraintsSchema>;
