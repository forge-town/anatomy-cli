import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ResultAsync } from "neverthrow";
import { AnatomyModelConfigSchema } from "./AnatomyModelConfigSchema.js";
import { AnatomyModelError } from "./AnatomyModelError.js";
import { getModelConfigPath } from "./getModelConfigPath.js";
import { readModelConfig } from "./readModelConfig.js";

export const runModelConfig = (args: string[], writeOutput: (value: string) => void = (value) => process.stdout.write(`${value}\n`)) =>
  ResultAsync.fromPromise((async () => {
    if (args.length === 1 && ["--help", "-h"].includes(args[0]!)) {
      writeOutput("Usage: anatomy config model --base-url <url> --model <name> [--api-key-env <name>] [--timeout-ms <1000..300000>] [--no-json-mode] [--model-config <file>]\nUse --show to display saved settings, or --json-mode to enable JSON mode again. API keys are read from the named environment variable, never saved.");
      return 0;
    }
    const values: Record<string, unknown> = {};
    let customPath: string | undefined;
    let show = false;
    const flags: Record<string, string> = { "--base-url": "baseUrl", "--model": "model", "--api-key-env": "apiKeyEnv", "--timeout-ms": "timeoutMs" };
    for (let index = 0; index < args.length; index++) {
      const flag = args[index]!;
      if (flag === "--show") { show = true; continue; }
      if (flag === "--no-json-mode") { values.jsonMode = false; continue; }
      if (flag === "--json-mode") { values.jsonMode = true; continue; }
      const key = flags[flag];
      if (!key && flag !== "--model-config") throw new AnatomyModelError(`Unknown model configuration option: ${flag}`);
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new AnatomyModelError(`${flag} requires a value`);
      if (flag === "--model-config") customPath = value;
      else values[key!] = key === "timeoutMs" ? Number(value) : value;
    }
    const path = getModelConfigPath(customPath);
    if (show) {
      if (Object.keys(values).length) throw new AnatomyModelError("--show cannot be combined with model updates");
      const config = await readModelConfig(path);
      if (config.isErr()) throw config.error;
      writeOutput(JSON.stringify(config.value, null, 2));
      return 0;
    }
    if (!Object.keys(values).length) throw new AnatomyModelError("Set --base-url and --model, or use --show. API keys are read from --api-key-env, never stored here.");
    const existing = await ResultAsync.fromPromise(readFile(path, "utf8"), (cause) => cause as NodeJS.ErrnoException);
    if (existing.isErr() && existing.error.code !== "ENOENT") throw new AnatomyModelError("Cannot read existing model configuration");
    const previous = existing.isOk() ? AnatomyModelConfigSchema.parse(JSON.parse(existing.value)) : {};
    const config = AnatomyModelConfigSchema.safeParse({ ...previous, ...values });
    if (!config.success) throw new AnatomyModelError("Invalid settings: supply an HTTP(S) --base-url, --model, a valid --api-key-env name, and timeout of 1000–300000 ms.");
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, JSON.stringify(config.data, null, 2) + "\n", { mode: 0o600 });
    writeOutput(`Model configuration saved to ${path}. API key is read from ${config.data.apiKeyEnv}.`);
    return 0;
  })(), (cause) => cause instanceof AnatomyModelError ? cause : new AnatomyModelError("Unable to save model configuration", { cause }));
