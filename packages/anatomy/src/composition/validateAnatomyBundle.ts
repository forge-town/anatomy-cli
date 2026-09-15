import type { AnatomyBundleValidationOutcome } from "@anatomy-cli/schemas";
import { resolveAnatomyBundle } from "./resolveAnatomyBundle.js";
export const validateAnatomyBundle = (
  input: unknown,
): AnatomyBundleValidationOutcome => {
  const resolved = resolveAnatomyBundle(input);
  return resolved.isErr()
    ? { status: "error", diagnostics: resolved.error }
    : { status: "valid", bundle: resolved.value.bundle };
};
