import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const publicUrl = process.env.CMS_PUBLIC_URL ?? "http://localhost:5173";

export default buildConfig({
  admin: { user: "users" },
  collections: [
    { slug: "users", auth: true, fields: [{ name: "displayName", type: "text" }] },
    { slug: "docs", admin: { useAsTitle: "title" }, fields: [{ name: "title", type: "text", required: true }, { name: "slug", type: "text", required: true, unique: true }, { name: "summary", type: "textarea" }, { name: "content", type: "richText" }] },
  ],
  cors: [publicUrl],
  csrf: [publicUrl],
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/anatomy_docs" }, push: false }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "anatomy-cli-docs-local-secret",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});
