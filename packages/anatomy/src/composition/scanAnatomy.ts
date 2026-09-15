import type {
  AnatomyScanOutcome,
  AnatomySourceExports,
} from "@anatomy-cli/schemas";
import { ResultAsync } from "neverthrow";
import { planAnatomyBundle } from "./planAnatomyBundle.js";
import { applyAnatomyExportChecks } from "../core/applyAnatomyExportChecks.js";

export const scanAnatomy = async (
  input: unknown,
): Promise<AnatomyScanOutcome> => {
  const planned = planAnatomyBundle(input);
  if (planned.isErr())
    return {
      operation: "check",
      status: "error",
      conforms: null,
      diagnostics: planned.error,
    };
  const { issues, exports, sources } = planned.value;
  const analyzed = new Map<string, AnatomySourceExports>();
  if (exports.length) {
    const analyzer = await ResultAsync.fromPromise(
      import("../source/analyzeSourceExports.js"),
      () => ({
        code: "source_analysis_error" as const,
        message: "Unable to load source analyzer",
      }),
    );
    if (analyzer.isErr())
      return {
        operation: "check",
        status: "error",
        conforms: null,
        diagnostics: [analyzer.error],
      };
    for (const { check, finding } of exports) {
      if (!analyzed.has(check.path)) {
        const source = sources[check.path];
        if (source === undefined)
          return {
            operation: "check",
            status: "error",
            conforms: null,
            diagnostics: [
              {
                code: "source_unavailable",
                message: "Source text required for export rule",
                entryPath: check.path,
              },
            ],
          };
        const result = analyzer.value.analyzeSourceExports(check.path, source);
        if (result.isErr())
          return {
            operation: "check",
            status: "error",
            conforms: null,
            diagnostics: [
              {
                code: "source_analysis_error",
                message: result.error.message,
                entryPath: check.path,
              },
            ],
          };
        analyzed.set(check.path, result.value);
      }
      const checked = applyAnatomyExportChecks(
        {
          issues: [],
          summary: { block: 0, warn: 0, allow: 0 },
          conforms: true,
        },
        [check],
        analyzed,
      );
      if (checked.isErr())
        return {
          operation: "check",
          status: "error",
          conforms: null,
          diagnostics: [
            { code: "source_analysis_error", message: checked.error.message },
          ],
        };
      issues.push(...checked.value.issues.map(finding));
    }
  }
  issues.sort((a, b) =>
    a.issueKey < b.issueKey ? -1 : a.issueKey > b.issueKey ? 1 : 0,
  );
  const summary = { block: 0, warn: 0, allow: 0 };
  for (const issue of issues) summary[issue.severity]++;
  return {
    operation: "check",
    status: "completed",
    conforms: summary.block === 0,
    summary,
    issues,
  };
};
