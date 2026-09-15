import { runNpmRelease } from "./runNpmRelease.js";

const result = await runNpmRelease(process.argv[2] ?? "prepare");
if (result.isErr()) {
  console.error(result.error.message);
  process.exitCode = 1;
}
