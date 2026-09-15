import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { Result, ResultAsync, ok } from "neverthrow";
import {
  planAnatomyBundle,
  scanAnatomy,
  queryAnatomyBundle,
} from "@anatomy-cli/anatomy";
import type {
  AnatomyDiagnostic,
  AnatomyScanOutcome,
  AnatomyBundleQueryOutcome,
} from "@anatomy-cli/schemas";
import type { AnatomyCliOptions } from "./parseCliArguments.js";
import type { AnatomyCliDependencies } from "./runAnatomyCli.js";
import { collectGitFileTree } from "./collectGitFileTree.js";

export const runAnatomyBundleCli = async (
  options: AnatomyCliOptions,
  dependencies: AnatomyCliDependencies,
) => {
  const emit = (result: AnatomyScanOutcome | AnatomyBundleQueryOutcome) => {
    if (options.format === "json")
      dependencies.writeOutput(JSON.stringify(result, null, 2));
    else if (result.status === "error")
      dependencies.writeOutput(
        result.diagnostics
          .map((d) => `ERROR ${d.code}: ${d.message}`)
          .join("\n"),
      );
    else if (result.operation === "query")
      dependencies.writeOutput(JSON.stringify(result, null, 2));
    else
      dependencies.writeOutput(
        [
          result.conforms
            ? "Anatomy structure conforms"
            : "Anatomy structure does not conform",
          ...result.issues.map(
            (i) =>
              `${i.severity.toUpperCase()} ${i.code} ${i.entryPath} [${i.origin.definitionKey}${i.origin.rulePath}]: ${i.message}`,
          ),
          `block: ${result.summary.block}, warn: ${result.summary.warn}, allow: ${result.summary.allow}`,
        ].join("\n"),
      );
    return ok(
      result.status === "error"
        ? 2
        : result.operation === "check" && !result.conforms
          ? 1
          : 0,
    );
  };
  const fail = (diagnostic: AnatomyDiagnostic) =>
    emit(
      options.queryPath === null
        ? {
            operation: "check",
            status: "error",
            conforms: null,
            diagnostics: [diagnostic],
          }
        : {
            operation: "query",
            status: "error",
            diagnostics: [diagnostic],
          },
    );
  const raw = await ResultAsync.fromPromise(
    readFile(resolve(options.bundlePath!), "utf8"),
    () => ({
      code: "invalid_bundle" as const,
      message: "Unable to read bundle file",
    }),
  );
  if (raw.isErr()) return fail(raw.error);
  const bundle = Result.fromThrowable(
    (text: string): unknown => JSON.parse(text),
    () => ({ code: "invalid_bundle" as const, message: "Invalid bundle JSON" }),
  )(raw.value);
  if (bundle.isErr()) return fail(bundle.error);
  const name = basename(resolve(options.targetPath));
  if (options.queryPath !== null)
    return emit(
      queryAnatomyBundle({
        bundle: bundle.value,
        path: options.queryPath,
        targetName: name,
      }),
    );
  const collected = options.gitFiles
    ? await (dependencies.collectGitTree ?? collectGitFileTree)(
        options.targetPath,
      )
    : await dependencies.collectTree(options.targetPath, options.ignore);
  if (collected.isErr())
    return fail({ code: "invalid_tree", message: collected.error.message });
  const input = {
    bundle: bundle.value,
    target: { name, kind: "directory" as const, children: collected.value },
    coverage: { status: "complete" as const },
  };
  const plan = planAnatomyBundle(input);
  if (plan.isErr())
    return emit({
      operation: "check",
      status: "error",
      conforms: null,
      diagnostics: plan.error,
    });
  const sources: Record<string, string> = {};
  for (const { check } of plan.value.exports) {
    if (Object.hasOwn(sources, check.path)) continue;
    const source = await ResultAsync.fromPromise(
      readFile(resolve(options.targetPath, check.path), "utf8"),
      () => ({
        code: "source_unavailable" as const,
        message: "Unable to read required source",
        entryPath: check.path,
      }),
    );
    if (source.isErr()) return fail(source.error);
    sources[check.path] = source.value;
  }
  return emit(await scanAnatomy({ ...input, sources }));
};
