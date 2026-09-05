import { withPayload } from "@payloadcms/tanstack-start";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import rsc from "@vitejs/plugin-rsc";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { docsEntries } from "./src/content";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  withPayload(
    ({ pluginOptions, env }) => ({
      plugins: [
        tailwindcss(),
        rsc(pluginOptions.rsc),
        tanstackStart({
          ...pluginOptions.tanstackStart,
          ...(env.mode === "cloudflare" && {
            pages: [{ path: "/" }, ...docsEntries.map(({ slug }) => ({ path: `/docs/${slug}` }))],
            prerender: {
              enabled: true,
              autoStaticPathsDiscovery: false,
              crawlLinks: false,
              failOnError: true,
            },
          }),
        }),
        react(pluginOptions.react),
        nitro({
          ...pluginOptions.nitro,
          ...(env.mode === "cloudflare" && { preset: "node-server" }),
        }),
      ],
      resolve: {
        alias: [{ find: /^@\//, replacement: `${path.resolve(dirname, "src")}/` }],
        tsconfigPaths: true,
      },
      server: { host: "127.0.0.1", strictPort: true, port: 5173 },
      build: { target: "esnext" },
    }),
    { payloadConfigPath: path.resolve(dirname, "src/payload.config.ts"), routesDirectory: "routes" },
  ),
);
