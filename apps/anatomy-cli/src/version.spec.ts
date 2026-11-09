import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AnatomyVersionError } from "./AnatomyVersionError.js";
import { readAnatomyVersion } from "./readAnatomyVersion.js";

let temporary: string;
const root = resolve(import.meta.dirname, "../../..");
beforeEach(() => {
  mkdirSync(join(root, "docs"), { recursive: true });
  temporary = mkdtempSync(join(root, "docs/version-test-"));
  mkdirSync(join(temporary, "src"));
  mkdirSync(join(temporary, "dist"));
});
afterEach(() => rmSync(temporary, { recursive: true, force: true }));

describe("release version metadata", () => {
  it.each(["src/readAnatomyVersion.ts", "dist/main.js"])("reads the runtime package version for %s", (entry) => {
    const path = join(temporary, "package.json");
    writeFileSync(path, JSON.stringify({ name: "anatomy-cli", version: "0.0.5" }));
    const url = pathToFileURL(join(temporary, entry)).href;
    expect(readAnatomyVersion(url)._unsafeUnwrap()).toBe("0.0.5");
    writeFileSync(path, JSON.stringify({ name: "anatomy-cli", version: "0.0.6-canary.12.1" }));
    expect(readAnatomyVersion(url)._unsafeUnwrap()).toBe("0.0.6-canary.12.1");
  });
  it("reads a detached installation's own version rather than a parent package", () => {
    const prefix = join(temporary, "standalone");
    mkdirSync(prefix);
    writeFileSync(join(temporary, "package.json"), JSON.stringify({ name: "anatomy-cli", version: "9.9.9" }));
    writeFileSync(join(prefix, "install.json"), JSON.stringify({ owner: "anatomy-cli/installer-v1", version: "0.0.5" }));
    expect(readAnatomyVersion(pathToFileURL(join(prefix, "anatomy.mjs")).href)._unsafeUnwrap()).toBe("0.0.5");
  });
  it.each([
    "not JSON",
    JSON.stringify({ name: "other-package", version: "0.0.5" }),
    JSON.stringify({ name: "anatomy-cli" }),
    JSON.stringify({ name: "anatomy-cli", version: 5 }),
    JSON.stringify({ name: "anatomy-cli", version: "" }),
  ])("reports malformed or unowned metadata as a typed error", (metadata) => {
    writeFileSync(join(temporary, "package.json"), metadata);
    expect(readAnatomyVersion(pathToFileURL(join(temporary, "dist/main.js")).href)._unsafeUnwrapErr()).toBeInstanceOf(AnatomyVersionError);
  });
  it("reports missing metadata and invalid URLs as Result errors", () => {
    expect(readAnatomyVersion(pathToFileURL(join(temporary, "dist/main.js")).href).isErr()).toBe(true);
    expect(readAnatomyVersion("not a file URL").isErr()).toBe(true);
  });
  it("rejects an unowned standalone marker", () => {
    writeFileSync(join(temporary, "install.json"), JSON.stringify({ owner: "other", version: "0.0.5" }));
    expect(readAnatomyVersion(pathToFileURL(join(temporary, "anatomy.mjs")).href).isErr()).toBe(true);
  });
});
