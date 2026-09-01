import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const packageRoot = new URL("../", import.meta.url);

const expectedDefinitions = [
  "dao.anatomy.json",
  "drizzle-relation.anatomy.json",
  "drizzle-table.anatomy.json",
  "mobile-screen.anatomy.json",
  "repository.anatomy.json",
  "schemas.anatomy.json",
  "service.anatomy.json",
  "trpc-router.anatomy.json",
  "zod-schema.anatomy.json",
];

type AnatomyNode = {
  alternatives?: AnatomyNode[];
  children?: AnatomyNode[];
  id: string;
  kind: "directory" | "file" | "one_of";
};

type AnatomyDefinition = {
  structure: {
    defaultPolicies: Record<string, string>;
    root: { children: AnatomyNode[] };
    schemaVersion: number;
  };
};

const collectIds = (nodes: AnatomyNode[], ids: string[] = []): string[] => {
  for (const node of nodes) {
    ids.push(node.id);
    if (node.kind === "one_of") {
      collectIds(node.alternatives ?? [], ids);
    } else if (node.kind === "directory") {
      collectIds(node.children ?? [], ids);
    }
  }

  return ids;
};

describe("anatomy CLI configuration package", () => {
  it("exports the Tellyn Anatomy catalogue from src", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("package.json", packageRoot), "utf8"),
    ) as { exports: Record<string, string> };

    expect(Object.values(packageJson.exports).sort()).toEqual(
      expectedDefinitions.map((filename) => `./src/anatomies/${filename}`).sort(),
    );
  });

  it("keeps every definition strict with unique UUIDs per definition", async () => {
    for (const filename of expectedDefinitions) {
      const definition = JSON.parse(
        await readFile(new URL(`anatomies/${filename}`, import.meta.url), "utf8"),
      ) as AnatomyDefinition;
      const ids = collectIds(definition.structure.root.children);

      expect(definition.structure.schemaVersion, filename).toBe(1);
      expect(definition.structure.defaultPolicies, filename).toEqual({
        missingRequired: "block",
        nameMismatch: "block",
        nestingMismatch: "block",
        unexpectedEntry: "block",
      });
      expect(new Set(ids).size, `${filename} has duplicate IDs`).toBe(ids.length);
      for (const id of ids) {
        expect(id, `${filename} contains an invalid UUID`).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    }
  });
});
