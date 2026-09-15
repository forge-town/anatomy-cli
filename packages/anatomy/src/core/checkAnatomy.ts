import {
  type AnatomyDraftInput,
  type AnatomySourceExports,
} from "@anatomy-cli/schemas";
import { err, type Result as ResultType } from "neverthrow";
import { applyAnatomyExportChecks } from "./applyAnatomyExportChecks.js";
import { AnatomySourceAnalysisError } from "./AnatomySourceAnalysisError.js";
import {
  planAnatomyCheck,
  type AnatomyCheckResult,
  type AnatomyFileTreeEntry,
} from "./planAnatomyCheck.js";
import { type AnatomyValidationIssue } from "./validateAnatomyForPublish.js";

export const checkAnatomy = (
  definition: AnatomyDraftInput,
  entries: AnatomyFileTreeEntry[],
  sourceExports: ReadonlyMap<string, AnatomySourceExports> = new Map(),
): ResultType<
  AnatomyCheckResult,
  AnatomyValidationIssue[] | AnatomySourceAnalysisError
> => {
  const plan = planAnatomyCheck(definition, entries);
  if (plan.isErr()) return err(plan.error);
  const { structuralResult, exportChecks } = plan.value;
  return applyAnatomyExportChecks(
    structuralResult,
    exportChecks,
    sourceExports,
  );
};
