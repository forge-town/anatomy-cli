import { resolvePackageImports } from "./resolvePackageImports.js";

const result = await resolvePackageImports(
  new URL("../dist", import.meta.url).pathname,
);
if (result.isErr()) {
  console.error(result.error.message);
  process.exitCode = 1;
}
