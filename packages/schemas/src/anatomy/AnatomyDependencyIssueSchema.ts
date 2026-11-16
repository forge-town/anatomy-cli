import { z } from "zod/v4";

/** One forbidden direct edge with source location and local rule identity. */
export const AnatomyDependencyIssueSchema = z.strictObject({
  /** Dependency finding discriminator. */
  code: z.literal("dependency_forbidden"),
  /** Effective policy of the matching rule. */
  severity: z.enum(["block", "warn"]),
  /** Importer path relative to the overall scan root. */
  path: z.string(),
  /** Actionable rule and edge explanation. */
  message: z.string(),
  /** Position in the owning definition's dependency rule list. */
  ruleIndex: z.int().nonnegative(),
  /** Author-provided rule name. */
  ruleName: z.string(),
  /** Original import text. */
  specifier: z.string(),
  /** Resolved local target path relative to the overall scan root. */
  targetPath: z.string(),
  /** One-based source line. */
  line: z.int().positive(),
  /** One-based source column. */
  column: z.int().positive(),
});
export type AnatomyDependencyIssue = z.infer<typeof AnatomyDependencyIssueSchema>;
