import { setTimeout as delay } from "node:timers/promises";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { AnatomyWatchError } from "./AnatomyWatchError.js";
import { formatAgentError } from "./formatAgentError.js";
import { parseCliArguments } from "./parseCliArguments.js";
import { readWatchSnapshot } from "./readWatchSnapshot.js";
import { runAnatomyCli } from "./runAnatomyCli.js";

export type AnatomyWatchDependencies = {
  check?: typeof runAnatomyCli;
  snapshot?: typeof readWatchSnapshot;
  writeOutput?: (value: string) => void;
  writeError?: (value: string) => void;
  intervalMs?: number;
  debounceMs?: number;
};

export const runAnatomyWatch = (
  args: string[],
  signal: AbortSignal,
  dependencies: AnatomyWatchDependencies = {},
) => ResultAsync.fromPromise((async () => {
  const parsed = parseCliArguments(args);
  if (parsed.isErr()) return err(parsed.error);
  const options = parsed.value;
  const check = dependencies.check ?? runAnatomyCli;
  if (!options.watch || options.help || options.version) return check(args);
  const snapshot = dependencies.snapshot ?? readWatchSnapshot;
  const writeOutput = dependencies.writeOutput ?? ((value: string) => process.stdout.write(`${value}\n`));
  const writeError = dependencies.writeError ?? ((value: string) => process.stderr.write(`${value}\n`));
  const intervalMs = dependencies.intervalMs ?? 500;
  const debounceMs = dependencies.debounceMs ?? 150;
  const first = await snapshot(options);
  if (first.isErr()) return err(first.error);
  let observed = first.value;
  let checked = observed;
  let changedAt = 0;
  let lastExitCode = 0;
  const scan = async () => {
    const outputs: string[] = [];
    const result = await check(args, { writeOutput: (value) => outputs.push(value) });
    for (const output of outputs) {
      const rendered = Result.fromThrowable(
        () => options.format === "json" ? JSON.stringify(JSON.parse(output)) : output,
        (cause) => new AnatomyWatchError("Unable to format watch report", { cause }),
      )();
      if (rendered.isErr()) return err(rendered.error);
      writeOutput(rendered.value);
    }
    if (result.isErr()) {
      writeError(options.format === "json"
        ? formatAgentError(result.error, true)
        : `Anatomy error: ${result.error.message}`);
      lastExitCode = 2;
    } else lastExitCode = result.value;
    return ok(undefined);
  };
  if (signal.aborted) return ok(lastExitCode);
  const initial = await scan();
  if (initial.isErr()) return err(initial.error);
  if (options.format !== "json" && !signal.aborted)
    writeError(`Watching ${options.targetPath} for changes. Press Ctrl+C to stop.`);
  while (!signal.aborted) {
    const waited = await ResultAsync.fromPromise(delay(intervalMs, undefined, { signal }),
      (cause) => new AnatomyWatchError("Watch wait failed", { cause }));
    if (signal.aborted) break;
    if (waited.isErr()) return err(waited.error);
    const next = await snapshot(options);
    if (signal.aborted) break;
    if (next.isErr()) return err(next.error);
    if (next.value !== observed) {
      observed = next.value;
      changedAt = Date.now();
    }
    if (observed !== checked && Date.now() - changedAt >= debounceMs) {
      checked = observed;
      const result = await scan();
      if (result.isErr()) return err(result.error);
    }
  }
  return ok(lastExitCode);
})(), (cause) => new AnatomyWatchError("Watch session failed", { cause }))
  .andThen((result) => result);
