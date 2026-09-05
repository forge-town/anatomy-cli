import { err, ok } from "neverthrow";
import { createEmptyAnatomyDraft } from "@anatomy-cli/anatomy/core";
import { describe, expect, it, vi } from "vitest";
import { AnatomyDefinitionFileError, AnatomyFileTreeError } from "./filesystem";
import { AnatomyCliExitCode, runAnatomyCli, type AnatomyCliDependencies } from "./cli";

const definition = createEmptyAnatomyDraft("Empty", "Allows an empty root");

const createDependencies = (
  entries: Awaited<ReturnType<AnatomyCliDependencies["collectTree"]>>,
) => {
  return {
    findDefinition: vi.fn(async () => ok("/project/anatomy.json")),
    readDefinition: vi.fn<AnatomyCliDependencies["readDefinition"]>(async () => ok(definition)),
    collectTree: vi.fn<AnatomyCliDependencies["collectTree"]>(async () => entries),
    writeOutput: vi.fn(),
  } satisfies AnatomyCliDependencies;
};

describe("runAnatomyCli", () => {
  it("returns success and human output for a conforming project", async () => {
    const dependencies = createDependencies(ok([]));
    const result = await runAnatomyCli(["--definition", "anatomy.json"], dependencies);

    expect(result._unsafeUnwrap()).toBe(AnatomyCliExitCode.success);
    expect(dependencies.findDefinition).not.toHaveBeenCalled();
    expect(dependencies.writeOutput).toHaveBeenCalledWith(
      expect.stringContaining("Anatomy check: PASS"),
    );
  });

  it("discovers anatomy.json when no definition is provided", async () => {
    const dependencies = createDependencies(ok([]));

    const result = await runAnatomyCli(["src/services"], dependencies);

    expect(result._unsafeUnwrap()).toBe(AnatomyCliExitCode.success);
    expect(dependencies.findDefinition).toHaveBeenCalledWith("src/services");
    expect(dependencies.readDefinition).toHaveBeenCalledWith("/project/anatomy.json");
    expect(dependencies.collectTree).toHaveBeenCalledWith("src/services", []);
  });

  it("returns the blocked exit code and stable JSON output", async () => {
    const requiredDefinition = {
      ...definition,
      structure: {
        ...definition.structure,
        root: {
          children: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              kind: "file" as const,
              name: { type: "literal" as const, value: "index.ts" },
              quantity: "exactly_one" as const,
              policyOverrides: {},
            },
          ],
        },
      },
    };
    const dependencies = createDependencies(ok([]));
    dependencies.readDefinition.mockResolvedValue(ok(requiredDefinition));

    const result = await runAnatomyCli(
      ["--definition", "anatomy.json", "--format", "json"],
      dependencies,
    );

    expect(result._unsafeUnwrap()).toBe(AnatomyCliExitCode.blocked);
    expect(JSON.parse(dependencies.writeOutput.mock.calls[0]?.[0] ?? "")).toMatchObject({
      conforms: false,
      summary: { block: 1 },
    });
  });

  it("returns operational errors without converting them into findings", async () => {
    const dependencies = createDependencies(err(new AnatomyFileTreeError("unreadable", ".")));
    dependencies.readDefinition.mockResolvedValue(
      err(new AnatomyDefinitionFileError("invalid", "anatomy.json")),
    );

    const result = await runAnatomyCli(["--definition", "anatomy.json"], dependencies);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(AnatomyDefinitionFileError);
    expect(dependencies.collectTree).not.toHaveBeenCalled();
  });
});
