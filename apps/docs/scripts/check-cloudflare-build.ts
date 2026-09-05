import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { docsEntries } from "../src/content";

const publicDirectory = new URL("../.output/public/", import.meta.url);
const pages = ["index.html", ...docsEntries.map(({ slug }) => `docs/${slug}/index.html`)];

for (const page of pages) {
  const html = await readFile(new URL(page, publicDirectory), "utf8");
  assert(html.includes("<html") && html.includes("</html>"), `${page} must contain a rendered HTML document`);
  assert(html.includes('type="module"'), `${page} must include the client application`);
}

const redirects = await readFile(new URL("_redirects", publicDirectory), "utf8");
assert(redirects.includes("/docs /docs/installation 302"), "The documentation redirect must be included");
console.log(`Validated ${pages.length} public pages for Cloudflare.`);
