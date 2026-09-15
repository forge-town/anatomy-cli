import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { ResultAsync } from "neverthrow";
import { NpmReleaseError } from "./NpmReleaseError.js";

export const resolvePackageImports = (output: string) =>
  ResultAsync.fromPromise(
    (async () => {
      const root = resolve(output);
      const mappings = new Map<string, string>();
      for (const name of ["anatomy", "schemas"]) {
        const pkg = JSON.parse(
          await readFile(
            new URL(`../../../packages/${name}/package.json`, import.meta.url),
            "utf8",
          ),
        );
        for (const [key, value] of Object.entries(pkg.exports) as [
          string,
          { default: string },
        ][]) {
          if (key.includes("*")) continue;
          mappings.set(
            pkg.name + (key === "." ? "" : key.slice(1)),
            join(
              root,
              "packages",
              name,
              "src",
              value.default.replace("./dist/", ""),
            ),
          );
        }
      }
      for (const entry of await readdir(root, {
        recursive: true,
        withFileTypes: true,
      })) {
        if (!entry.isFile() || !/\.(js|ts)$/.test(entry.name)) continue;
        const path = join(entry.parentPath, entry.name);
        const contents = await readFile(path, "utf8");
        const rewritten = contents.replace(
          /(["'])((?:@anatomy-cli\/(?:anatomy|schemas))(?:\/[^"']*)?)\1/g,
          (_, quote: string, specifier: string) => {
            const target =
              mappings.get(specifier) ??
              (specifier.startsWith("@anatomy-cli/schemas/anatomy/")
                ? join(
                    root,
                    "packages/schemas/src/anatomy",
                    specifier.slice("@anatomy-cli/schemas/anatomy/".length) +
                      ".js",
                  )
                : undefined);
            if (!target)
              throw new NpmReleaseError(
                `Unresolved internal import in ${path}: ${specifier}`,
              );
            const local = relative(dirname(path), target).replaceAll("\\", "/");
            return (
              quote + (local.startsWith(".") ? local : "./" + local) + quote
            );
          },
        );
        if (rewritten !== contents) await writeFile(path, rewritten);
      }
    })(),
    (cause) =>
      new NpmReleaseError(
        `Package import resolution failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  );
