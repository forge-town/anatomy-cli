import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyAnatomyDraft } from "@anatomy-cli/anatomy/core";
import { collectFileTree, readAnatomyDefinition } from "./filesystem";

const testDirectory = join(process.cwd(), ".anatomy-cli-test");

afterEach(async () => {
  await rm(testDirectory, { recursive: true, force: true });
});

describe("Anatomy CLI filesystem adapter", () => {
  it("reads an Anatomy Draft definition from JSON", async () => {
    await mkdir(testDirectory, { recursive: true });
    const path = join(testDirectory, "anatomy.json");
    await writeFile(
      path,
      JSON.stringify(createEmptyAnatomyDraft("Component", "Structure")),
      "utf8",
    );

    const result = await readAnatomyDefinition(path);

    expect(result._unsafeUnwrap()).toMatchObject({ name: "Component" });
  });

  it("collects a deterministic tree and ignores generated directories", async () => {
    await mkdir(join(testDirectory, "src"), { recursive: true });
    await mkdir(join(testDirectory, "node_modules", "dependency"), {
      recursive: true,
    });
    await mkdir(join(testDirectory, "generated"), { recursive: true });
    await writeFile(join(testDirectory, "src", "index.ts"), "", "utf8");
    await writeFile(join(testDirectory, "README.md"), "", "utf8");
    await writeFile(join(testDirectory, "generated", "output.ts"), "", "utf8");

    const result = await collectFileTree(testDirectory, ["generated"]);

    expect(result._unsafeUnwrap()).toEqual([
      { kind: "file", name: "README.md" },
      {
        kind: "directory",
        name: "src",
        children: [{ kind: "file", name: "index.ts" }],
      },
    ]);
  });
});
