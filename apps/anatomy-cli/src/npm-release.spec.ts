import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { planNpmRelease, type NpmPackageHistory } from "./planNpmRelease.js";

const sha = "a".repeat(40);
const history = (): NpmPackageHistory[] => [{
  name: "anatomy-cli",
  versions: { "0.0.4": { gitHead: "b".repeat(40) } },
  tags: { latest: "0.0.4" },
}];
const plan = (histories = history(), version = "0.0.5", channel = "stable") =>
  planNpmRelease(histories, sha, channel, "12", "1", version);

describe("source-version npm release planning", () => {
  it("publishes the source manifest version instead of computing another patch", () => {
    expect(plan()._unsafeUnwrap()).toMatchObject({ version: "0.0.5", tag: "latest" });
    expect(plan(history(), "0.0.8")._unsafeUnwrap().version).toBe("0.0.8");
  });
  it("rejects a stale source version rather than silently fixing it in staging", () => {
    expect(plan(history(), "0.0.2").isErr()).toBe(true);
  });
  it("rejects a version already published from another source", () => {
    expect(plan(history(), "0.0.4").isErr()).toBe(true);
  });
  it("resumes the same source version after verification failed", () => {
    const h = history();
    h[0]!.versions["0.0.5"] = { gitHead: sha };
    expect(plan(h)._unsafeUnwrap().version).toBe("0.0.5");
  });
  it("does not publish the same source under a different stable version", () => {
    const h = history();
    h[0]!.versions["0.0.4"] = { gitHead: sha };
    expect(plan(h).isErr()).toBe(true);
  });
  it("refuses to restore latest to an older source release", () => {
    const h = history();
    h[0]!.versions["0.0.3"] = { gitHead: sha };
    expect(plan(h, "0.0.3").isErr()).toBe(true);
  });
  it("rejects conflicting stable versions for one source", () => {
    const h = history();
    h[0]!.versions["0.0.3"] = { gitHead: sha };
    h[0]!.versions["0.0.4"] = { gitHead: sha };
    expect(plan(h).isErr()).toBe(true);
  });
  it("appends canary identity to the source version without consuming stable patches", () => {
    const h = history();
    h[0]!.versions["0.0.99-canary.10.1"] = { gitHead: sha };
    expect(plan(h, "0.0.5", "canary")._unsafeUnwrap()).toMatchObject({
      version: "0.0.5-canary.12.1", tag: "canary",
    });
    expect(plan(h)._unsafeUnwrap().version).toBe("0.0.5");
  });
  it.each(["0.1.0", "1.0.0", "0.0.5-beta.1", "0.0.05", "bad", ""])(
    "rejects unsupported source version %s", version => {
      expect(plan(history(), version).isErr()).toBe(true);
    },
  );
  it("rejects registry versions outside the configured patch line", () => {
    const h = history();
    h[0]!.versions["0.1.0"] = {};
    expect(plan(h).isErr()).toBe(true);
  });
  it.each(["minor", "major", "canary; echo bad"])("rejects channel %s", channel => {
    expect(plan(history(), "0.0.5", channel).isErr()).toBe(true);
  });
  it.each([["bad", "1", "1"], [sha, "bad", "1"], [sha, "1", "bad"]])(
    "rejects malformed run identity", (source, run, attempt) => {
      expect(planNpmRelease(history(), source, "canary", run, attempt, "0.0.5").isErr()).toBe(true);
    },
  );
  it("rejects publishing internal or extra packages", () => {
    expect(plan([...history(), { name: "@anatomy-cli/schemas", versions: {}, tags: {} }]).isErr()).toBe(true);
  });
  it("publishes only through main or canary triggers and isolates the token", () => {
    const workflow = readFileSync(new URL("../../../.github/workflows/publish-npm.yml", import.meta.url), "utf8");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("tags: ['canary-*']");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).toContain("bun run quality");
  });
});
