import { z } from "zod/v4";

/** Root-relative POSIX glob, permitting * within a segment and whole ** segments. */
export const AnatomyDependencyPathPatternSchema = z.string().min(1).max(500)
  .regex(/^[A-Za-z0-9_@.*/-]+$/)
  .refine((value) => !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".." || (part.includes("**") && part !== "**")));
export type AnatomyDependencyPathPattern = z.infer<typeof AnatomyDependencyPathPatternSchema>;
