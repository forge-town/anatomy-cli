#!/usr/bin/env node

import { AnatomyCliExitCode } from "./AnatomyCliExitCode.js";
import { AnatomyCliUsage } from "./AnatomyCliUsage.js";
import { formatAgentError } from "./formatAgentError.js";
import { runAnatomyCli } from "./runAnatomyCli.js";
import { runAnatomyWatch } from "./runAnatomyWatch.js";
import { runModelConfig } from "./runModelConfig.js";
import { runSkillCommand } from "./runSkillCommand.js";

const args = process.argv.slice(2);
const controller = new AbortController();
const stop = () => controller.abort();
if (args.includes("--watch")) {
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
const result = args[0] === "skills" && ["install", "schema", "--help", "-h"].includes(args[1] ?? "")
  ? await runSkillCommand(args.slice(1))
  : args[0] === "config" && args[1] === "model"
  ? await runModelConfig(args.slice(2))
  : args.includes("--watch")
  ? await runAnatomyWatch(args, controller.signal)
  : await runAnatomyCli(args);
process.removeListener("SIGINT", stop);
process.removeListener("SIGTERM", stop);

result.match(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    const args = process.argv.slice(2);
    const json = args.some((argument, index) => argument === "--format" && args[index + 1] === "json");
    process.stderr.write(json ? `${formatAgentError(error, args.includes("--watch"))}\n` : `Anatomy error: ${error.message}\n\n${AnatomyCliUsage}\n`);
    process.exitCode = AnatomyCliExitCode.operationalError;
  },
);
