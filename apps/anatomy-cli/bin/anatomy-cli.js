#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distEntrypoint = join(packageRoot, "dist", "main.js");

if (existsSync(distEntrypoint)) {
  await import(pathToFileURL(distEntrypoint).href);
} else {
  const sourceEntrypoint = join(packageRoot, "src", "main.ts");
  const bunCommand = process.env.BUN_BINARY ?? "bun";
  const result = spawnSync(bunCommand, [sourceEntrypoint, ...process.argv.slice(2)], {
    stdio: "inherit",
  });

  if (result.error) {
    process.stderr.write(
      `Unable to start Anatomy. Build the package first or install Bun to run the workspace source: ${result.error.message}\n`,
    );
    process.exitCode = 2;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
