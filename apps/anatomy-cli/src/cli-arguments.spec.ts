import { describe, expect, it } from "vitest";
import { parseCliArguments } from "./cli-arguments";

describe("parseCliArguments", () => {
  it("parses the target, explicit definition, output format, and repeated ignores", () => {
    const result = parseCliArguments([
      "src",
      "--definition",
      "anatomy.json",
      "--format",
      "json",
      "--ignore",
      "generated,temp",
      "--ignore",
      "fixtures",
    ])._unsafeUnwrap();

    expect(result).toEqual({
      definitionPath: "anatomy.json",
      targetPath: "src",
      format: "json",
      ignore: ["generated", "temp", "fixtures"],
      help: false,
    });
  });

  it("treats the positional argument as the target and discovers the definition later", () => {
    expect(parseCliArguments(["src/services"])._unsafeUnwrap()).toMatchObject({
      definitionPath: null,
      targetPath: "src/services",
      format: "human",
    });
  });

  it("defaults to checking the current directory", () => {
    expect(parseCliArguments([])._unsafeUnwrap()).toMatchObject({
      definitionPath: null,
      targetPath: ".",
    });
  });

  it("keeps the legacy explicit target option working", () => {
    expect(
      parseCliArguments([
        "--definition",
        "anatomy.json",
        "--target",
        "src",
      ])._unsafeUnwrap(),
    ).toMatchObject({
      definitionPath: "anatomy.json",
      targetPath: "src",
    });
  });

  it("rejects multiple targets and unsupported formats", () => {
    expect(parseCliArguments(["src", "tests"]).isErr()).toBe(true);
    expect(parseCliArguments(["src", "--format", "xml"]).isErr()).toBe(true);
  });
});
