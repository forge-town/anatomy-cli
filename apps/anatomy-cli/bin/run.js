import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const runEntrypoint = async (name) => {
  const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const distEntrypoint = join(packageRoot, "dist", `${name}.js`);
  if (existsSync(distEntrypoint)) {
    await import(pathToFileURL(distEntrypoint).href);
    return;
  }

  const result = spawnSync(
    process.env.BUN_BINARY ?? "bun",
    [join(packageRoot, "src", `${name}.ts`), ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  if (result.error) {
    process.stderr.write(`Unable to start Anatomy. Build the package first: ${result.error.message}\n`);
  }
  process.exitCode = result.status ?? 2;
};
