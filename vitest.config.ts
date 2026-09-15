import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@anatomy-cli/anatomy/core",
        replacement: new URL(
          "./packages/anatomy/src/core/index.ts",
          import.meta.url,
        ).pathname,
      },
      {
        find: "@anatomy-cli/anatomy/source",
        replacement: new URL(
          "./packages/anatomy/src/source/index.ts",
          import.meta.url,
        ).pathname,
      },
      {
        find: "@anatomy-cli/anatomy/composition",
        replacement: new URL(
          "./packages/anatomy/src/composition/index.ts",
          import.meta.url,
        ).pathname,
      },
      {
        find: "@anatomy-cli/anatomy",
        replacement: new URL("./packages/anatomy/src/index.ts", import.meta.url)
          .pathname,
      },
      {
        find: "@anatomy-cli/schemas/anatomy",
        replacement: new URL(
          "./packages/schemas/src/anatomy/index.ts",
          import.meta.url,
        ).pathname,
      },
      {
        find: "@anatomy-cli/schemas/composition",
        replacement: new URL(
          "./packages/schemas/src/composition/index.ts",
          import.meta.url,
        ).pathname,
      },
      {
        find: "@anatomy-cli/schemas",
        replacement: new URL("./packages/schemas/src/index.ts", import.meta.url)
          .pathname,
      },
    ],
  },
  test: {
    globals: true,
    include: ["**/*.spec.ts"],
  },
});
