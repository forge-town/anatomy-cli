import {
type AnatomyDraftInput,
type AnatomySourceExports
} from "@anatomy-cli/schemas";
import { err, ok, type Result as ResultType } from "neverthrow";
import { AnatomyCheckCode } from "./AnatomyCheckCode";
import { AnatomySourceAnalysisError } from "./AnatomySourceAnalysisError";
import { planAnatomyCheck, type AnatomyCheckIssue, type AnatomyCheckResult, type AnatomyFileTreeEntry } from "./planAnatomyCheck";
import { type AnatomyValidationIssue } from "./validateAnatomyForPublish";

export const checkAnatomy = (
  definition: AnatomyDraftInput,
  entries: AnatomyFileTreeEntry[],
  sourceExports: ReadonlyMap<string, AnatomySourceExports> = new Map(),
): ResultType<AnatomyCheckResult, AnatomyValidationIssue[] | AnatomySourceAnalysisError> => {
  const plan = planAnatomyCheck(definition, entries);
  if (plan.isErr()) return err(plan.error);
  const { structuralResult, exportChecks } = plan.value;
  for (const check of exportChecks) {
    const actual = sourceExports.get(check.path);
    if (actual === undefined) return err(new AnatomySourceAnalysisError(check.path, `Exports were not analyzed for ${check.path}`));
    const addIssue = (code: AnatomyCheckIssue["code"], message: string) => {
      structuralResult.issues.push({
        code, message, severity: check.policy, path: check.path, constraintId: check.constraintId,
        expectedExport: check.expectedName, actualExports: actual,
      });
      structuralResult.summary[check.policy] += 1;
    };
    if (actual.length !== 1) {
      addIssue(AnatomyCheckCode.exportCountMismatch,
        `Expected exactly one named function export "${check.expectedName}" but found ${actual.length} runtime exports`);
      continue;
    }
    const exported = actual[0]!;
    if (exported.name === "default" || exported.name !== check.expectedName) {
      addIssue(AnatomyCheckCode.exportNameMismatch, `Expected named export "${check.expectedName}" but found "${exported.name}"`);
    }
    if (exported.kind !== "function") {
      addIssue(AnatomyCheckCode.exportKindMismatch, `Expected function export "${check.expectedName}" but found a non-function value`);
    }
  }
  structuralResult.conforms = structuralResult.summary.block === 0;
  return ok(structuralResult);
};
