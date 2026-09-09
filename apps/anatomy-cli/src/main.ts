#!/usr/bin/env node

import { AnatomyCliExitCode } from "./AnatomyCliExitCode";
import { AnatomyCliUsage } from "./AnatomyCliUsage";
import { formatAgentError } from "./formatAgentError";
import { runAnatomyCli } from "./runAnatomyCli";

const result = await runAnatomyCli(process.argv.slice(2));

result.match(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    const args = process.argv.slice(2);
    const json = args.some((argument, index) => argument === "--format" && args[index + 1] === "json");
    process.stderr.write(json ? `${formatAgentError(error)}\n` : `Anatomy error: ${error.message}\n\n${AnatomyCliUsage}\n`);
    process.exitCode = AnatomyCliExitCode.operationalError;
  },
);
