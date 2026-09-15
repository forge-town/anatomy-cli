import { err, ok } from "neverthrow";
import type { AnatomyDiagnostic } from "@anatomy-cli/schemas";
import { AnatomyResourceLimits } from "./AnatomyResourceLimits.js";

export const checkInputBudget = (input: unknown) => {
  const active = new Set<object>();
  const stack = [{ value: input, depth: 0, leave: false }];
  let count = 0;
  while (stack.length) {
    const { value, depth, leave } = stack.pop()!;
    if (value === null || typeof value !== "object") continue;
    if (leave) {
      active.delete(value);
      continue;
    }
    if (
      ++count > AnatomyResourceLimits.objects ||
      depth > AnatomyResourceLimits.inputDepth ||
      active.has(value)
    ) {
      return err<never, AnatomyDiagnostic>({
        code: "resource_limit_exceeded",
        message:
          "Input exceeds the object/depth budget or contains an object cycle",
      });
    }
    active.add(value);
    stack.push({ value, depth, leave: true });
    const values = Object.values(value);
    if (
      values.length > AnatomyResourceLimits.objects ||
      stack.length + values.length > AnatomyResourceLimits.objects * 2
    ) {
      return err<never, AnatomyDiagnostic>({
        code: "resource_limit_exceeded",
        message: "Input container exceeds the traversal budget",
      });
    }
    for (const child of values)
      stack.push({ value: child, depth: depth + 1, leave: false });
  }
  return ok(undefined);
};
