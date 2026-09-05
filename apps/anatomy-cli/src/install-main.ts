#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { ok } from "neverthrow";
import { installUsage, parseInstallOptions } from "./install-options";
import { runInstallation } from "./install";

const result = parseInstallOptions(process.argv.slice(2)).andThen((options) =>
  options.help ? ok([installUsage]) : runInstallation(options, {
    packageRoot: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
    home: homedir(),
    platform: process.platform,
    nodeVersion: process.versions.node,
    nodeExecutable: process.execPath,
    env: process.env,
  }),
);

result.match(
  (messages) => process.stdout.write(`${messages.join("\n\n")}\n`),
  (error) => {
    process.stderr.write(`Anatomy installation failed: ${error.message}\n${error.cause instanceof Error ? `${error.cause.message}\n` : ""}`);
    process.exitCode = 1;
  },
);
