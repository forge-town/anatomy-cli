import { describe, expect, it } from "vitest";
import { parseCliArguments } from "./cli-arguments";

describe("parseCliArguments", () => {
  it("parses definition, target, output format, and repeated ignores", () => {
    const result = parseCliArguments([
      "--definition",
      "anatomy.json",
      "--target",
      "src",
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

  it("accepts a positional definition and current-directory target", () => {
    expect(parseCliArguments(["anatomy.json"])._unsafeUnwrap()).toMatchObject({
      definitionPath: "anatomy.json",
      targetPath: ".",
      format: "human",
    });
  });

  it("rejects missing definitions and unsupported formats", () => {
    expect(parseCliArguments([]).isErr()).toBe(true);
    expect(parseCliArguments(["anatomy.json", "--format", "xml"]).isErr()).toBe(true);
  });
});
