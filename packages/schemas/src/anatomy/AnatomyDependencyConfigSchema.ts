import { z } from "zod/v4";
import { AnatomyDependencyPathPatternSchema } from "./AnatomyDependencyPathPatternSchema.js";

/** Local module boundary rules, relative to this definition's scan root. */
export const AnatomyDependencyConfigSchema = z.strictObject({
  /** Forbidden edges; every matching rule applies, including type-only edges. */
  rules: z.array(z.strictObject({
    /** Stable human-readable rule identifier, unique within this definition. */
    name: z.string().trim().min(1).max(120),
    /** Importer globs; * matches within a segment and ** matches whole segments. */
    from: z.array(AnatomyDependencyPathPatternSchema).min(1).max(50),
    /** Resolved target globs, with the same grammar as from. */
    to: z.array(AnatomyDependencyPathPatternSchema).min(1).max(50),
    /** A block fails conformance; a warn reports the edge without blocking. */
    policy: z.enum(["block", "warn"]).default("block"),
  })).min(1).max(100).refine((rules) => new Set(rules.map((r) => r.name)).size === rules.length, "Dependency rule names must be unique"),
  /** Explicit local aliases; unmapped bare imports are treated as external. */
  aliases: z.record(z.string().min(1).max(200).refine((v) => !v.startsWith(".") && !v.startsWith("/") && !/[\\\0]/.test(v) && (v.match(/\*/g)?.length ?? 0) <= 1), z.array(z.string().min(1).max(500).regex(/^[A-Za-z0-9_@.*/-]+$/).refine((v) => !v.startsWith("/") && !v.split("/").some((p) => !p || p === "." || p === "..") && (v.match(/\*/g)?.length ?? 0) <= 1)).min(1).max(20)).default({}),
}).superRefine((config, ctx) => {
  for (const [key, paths] of Object.entries(config.aliases)) {
    if (!key.includes("*") && paths.some((p) => p.includes("*"))) ctx.addIssue({ code: "custom", message: "Alias targets cannot contain * without a wildcard key", path: ["aliases", key] });
  }
});
export type AnatomyDependencyConfig = z.infer<typeof AnatomyDependencyConfigSchema>;
