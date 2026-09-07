import { checkAnatomy, planAnatomyCheck } from "@anatomy-cli/anatomy/core";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { collectSourceExports } from "./collectSourceExports";
import { collectFileTree } from "./collectFileTree";
import { readAnatomyDefinition } from "./readAnatomyDefinition";

describe("CLI source contract", () => {
  it("checks the real source directory against the shipped example definition", async () => {
    const definition = (await readAnatomyDefinition(
      resolve(import.meta.dirname, "../anatomies/cli-source.anatomy.json"),
    ))._unsafeUnwrap();
    const entries = (await collectFileTree(import.meta.dirname))._unsafeUnwrap();
    const plan = planAnatomyCheck(definition, entries)._unsafeUnwrap();
    const exports = (await collectSourceExports(import.meta.dirname, plan.exportChecks))._unsafeUnwrap();
    expect(exports.size).toBeGreaterThan(0);
    const result = checkAnatomy(definition, entries, exports)._unsafeUnwrap();

    expect(result.issues).toEqual([]);
    expect(result.conforms).toBe(true);
    expect(checkAnatomy(definition, entries.filter((entry) => entry.name !== "runAnatomyCli.ts"), exports)
      ._unsafeUnwrap().conforms).toBe(false);
    expect(checkAnatomy(definition, [...entries, { kind: "file", name: "undeclared.ts" }], exports)
      ._unsafeUnwrap().conforms).toBe(false);
  });
});
