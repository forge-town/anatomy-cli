import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { planNpmRelease, type NpmPackageHistory } from "./planNpmRelease.js";
const sha = "a".repeat(40);
const history = (): NpmPackageHistory[] => [
  { name: "@anatomy-cli/schemas", versions: {}, tags: {} },
  { name: "@anatomy-cli/anatomy", versions: {}, tags: {} },
  {
    name: "anatomy-cli",
    versions: { "0.0.3": { gitHead: "b".repeat(40) } },
    tags: { latest: "0.0.3" },
  },
];
describe("patch-only npm release planning", () => {
  it("starts unpublished SDK packages on the CLI's next patch", () => {
    expect(
      planNpmRelease(history(), sha, "stable", "12", "1")._unsafeUnwrap(),
    ).toMatchObject({ version: "0.0.4", tag: "latest" });
  });
  it("keeps canaries off latest and does not consume stable patch numbers", () => {
    const h = history();
    h[2]!.versions["0.0.99-canary.10.1"] = { gitHead: sha };
    expect(
      planNpmRelease(h, sha, "canary", "12", "2")._unsafeUnwrap(),
    ).toMatchObject({ version: "0.0.4-canary.12.2", tag: "canary" });
    expect(
      planNpmRelease(h, sha, "stable", "12", "2")._unsafeUnwrap().version,
    ).toBe("0.0.4");
  });
  it("resumes a partially published stable version instead of incrementing again", () => {
    const h = history();
    h[0]!.versions["0.0.4"] = { gitHead: sha };
    expect(
      planNpmRelease(h, sha, "stable", "12", "2")._unsafeUnwrap().version,
    ).toBe("0.0.4");
  });
  it("does not release a newer patch again for the same source", () => {
    const h = history();
    for (const p of h) p.versions["0.0.4"] = { gitHead: sha };
    expect(
      planNpmRelease(h, sha, "stable", "13", "1")._unsafeUnwrap().version,
    ).toBe("0.0.4");
  });
  it("refuses to roll latest back to an older source", () => {
    const h = history();
    h[0]!.versions["0.0.2"] = { gitHead: sha };
    expect(planNpmRelease(h, sha, "stable", "1", "1").isErr()).toBe(true);
  });
  it("rejects inconsistent versions for one source", () => {
    const h = history();
    h[0]!.versions["0.0.4"] = { gitHead: sha };
    h[1]!.versions["0.0.5"] = { gitHead: sha };
    expect(planNpmRelease(h, sha, "stable", "1", "1").isErr()).toBe(true);
  });
  it("never automatically crosses to a minor release", () => {
    const h = history();
    h[0]!.versions["0.1.0"] = {};
    expect(planNpmRelease(h, sha, "stable", "1", "1").isErr()).toBe(true);
  });
  it.each(["minor", "major", "canary; echo bad"])(
    "rejects unsupported channel %s",
    (channel) => {
      expect(planNpmRelease(history(), sha, channel, "1", "1").isErr()).toBe(
        true,
      );
    },
  );
  it.each([
    ["bad", "1", "1"],
    [sha, "bad", "1"],
    [sha, "1", "bad"],
  ])("rejects malformed run identity", (source, run, attempt) => {
    expect(
      planNpmRelease(history(), source, "canary", run, attempt).isErr(),
    ).toBe(true);
  });
  it("requires a complete package set", () => {
    expect(
      planNpmRelease(history().slice(1), sha, "stable", "1", "1").isErr(),
    ).toBe(true);
  });
  it("does not add a canary build or retry to the stable counter", () => {
    const h = history();
    h[2]!.versions["0.0.9"] = {};
    expect(
      planNpmRelease(h, sha, "canary", "999", "2")._unsafeUnwrap().version,
    ).toBe("0.0.10-canary.999.2");
  });
  it("publishes only through explicit main or canary triggers and isolates the token", () => {
    const workflow = readFileSync(
      new URL("../../../.github/workflows/publish-npm.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("tags: ['canary-*']");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).toContain("bun run quality");
  });
});
