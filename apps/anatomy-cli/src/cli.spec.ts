import { createEmptyAnatomyDraft } from "@anatomy-cli/anatomy/core";
import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";
import { AnatomyCliExitCode } from "./AnatomyCliExitCode.js";
import { AnatomyDefinitionFileError } from "./AnatomyDefinitionFileError.js";
import { AnatomyFileTreeError } from "./AnatomyFileTreeError.js";
import { AnatomyVersionError } from "./AnatomyVersionError.js";
import { runAnatomyCli, type AnatomyCliDependencies } from "./runAnatomyCli.js";

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
  it.each(["--version", "-v"])("prints the version for %s without scanning a project", async (flag) => {
    const dependencies = { ...createDependencies(ok([])), readVersion: vi.fn(() => ok("0.0.5-canary.12.1")) };
    const result = await runAnatomyCli([flag], dependencies);
    expect(result._unsafeUnwrap()).toBe(AnatomyCliExitCode.success);
    expect(dependencies.writeOutput).toHaveBeenCalledExactlyOnceWith("0.0.5-canary.12.1");
    expect(dependencies.findDefinition).not.toHaveBeenCalled();
    expect(dependencies.readDefinition).not.toHaveBeenCalled();
    expect(dependencies.collectTree).not.toHaveBeenCalled();
  });

  it("shows help without reading version metadata when both are requested", async () => {
    const dependencies = { ...createDependencies(ok([])), readVersion: vi.fn(() => ok("0.0.5")) };
    expect((await runAnatomyCli(["--help", "--version"], dependencies))._unsafeUnwrap()).toBe(0);
    expect(dependencies.writeOutput).toHaveBeenCalledWith(expect.stringContaining("Usage: anatomy"));
    expect(dependencies.readVersion).not.toHaveBeenCalled();
  });

  it("returns a version metadata error without attempting a check", async () => {
    const error = new AnatomyVersionError("package.json");
    const dependencies = { ...createDependencies(ok([])), readVersion: vi.fn(() => err(error)) };
    expect((await runAnatomyCli(["--version"], dependencies))._unsafeUnwrapErr()).toBe(error);
    expect(dependencies.writeOutput).not.toHaveBeenCalled();
    expect(dependencies.findDefinition).not.toHaveBeenCalled();
  });

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
