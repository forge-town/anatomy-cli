import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkAnatomy } from "@anatomy-cli/anatomy/core";
import { collectFileTree, readAnatomyDefinition } from "./filesystem";

describe("CLI source contract", () => {
  it("checks the real source directory against the shipped example definition", async () => {
    const definition = (await readAnatomyDefinition(
      resolve(import.meta.dirname, "../anatomies/cli-source.anatomy.json"),
    ))._unsafeUnwrap();
    const entries = (await collectFileTree(import.meta.dirname))._unsafeUnwrap();
    const result = checkAnatomy(definition, entries)._unsafeUnwrap();

    expect(result.issues).toEqual([]);
    expect(result.conforms).toBe(true);
    expect(checkAnatomy(definition, entries.filter((entry) => entry.name !== "cli.ts"))
      ._unsafeUnwrap().conforms).toBe(false);
    expect(checkAnatomy(definition, [...entries, { kind: "file", name: "undeclared.ts" }])
      ._unsafeUnwrap().conforms).toBe(false);
  });
});
