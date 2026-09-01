#!/usr/bin/env bun

import { AnatomyCliExitCode, runAnatomyCli } from "./cli";
import { AnatomyCliUsage } from "./cli-arguments";

const result = await runAnatomyCli(process.argv.slice(2));

result.match(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    process.stderr.write(`Anatomy CLI error: ${error.message}\n\n${AnatomyCliUsage}\n`);
    process.exitCode = AnatomyCliExitCode.operationalError;
  },
);
