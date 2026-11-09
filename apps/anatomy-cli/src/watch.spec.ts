import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { err, ok, ResultAsync } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnatomyDefinitionFileError } from "./AnatomyDefinitionFileError.js";
import { parseCliArguments } from "./parseCliArguments.js";
import { readWatchSnapshot } from "./readWatchSnapshot.js";
import { runAnatomyWatch } from "./runAnatomyWatch.js";
import type { runAnatomyCli } from "./runAnatomyCli.js";

const root = resolve(import.meta.dirname, "../../..");
const controllers: AbortController[] = [];
let temporary: string;
beforeEach(() => {
  mkdirSync(join(root, "docs/watch"), { recursive: true });
  temporary = mkdtempSync(join(root, "docs/watch/session-"));
});
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.abort();
  rmSync(temporary, { recursive: true, force: true });
});
const session = (check: typeof runAnatomyCli) => {
  const controller = new AbortController();
  controllers.push(controller);
  let state = "initial";
  const snapshot = vi.fn(() => ResultAsync.fromSafePromise(Promise.resolve(state)));
  const writeOutput = vi.fn();
  const writeError = vi.fn();
  const result = runAnatomyWatch(["--watch", "--format", "json"], controller.signal, {
    check, snapshot, writeOutput, writeError, intervalMs: 10, debounceMs: 25,
  });
  return { controller, snapshot, writeOutput, writeError, result, change: (value: string) => { state = value; } };
};

describe("watch sessions", () => {
  it("runs immediately, stays idle for unchanged snapshots, and emits NDJSON", async () => {
    const check = vi.fn<typeof runAnatomyCli>(async (_args, io) => {
      io!.writeOutput!(JSON.stringify({ operation: "check", conforms: true }, null, 2));
      return ok(0);
    });
    const watch = session(check);
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    await pause(60);
    expect(check).toHaveBeenCalledTimes(1);
    expect(watch.writeOutput).toHaveBeenCalledWith('{"operation":"check","conforms":true}');
    watch.controller.abort();
    expect((await watch.result)._unsafeUnwrap()).toBe(0);
  });
  it("coalesces a burst of changes into one later complete check", async () => {
    const check = vi.fn<typeof runAnatomyCli>(async () => ok(0));
    const watch = session(check);
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    watch.change("edit-1");
    await pause(15);
    watch.change("edit-2");
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(2));
    await pause(60);
    expect(check).toHaveBeenCalledTimes(2);
    watch.controller.abort();
    expect((await watch.result).isOk()).toBe(true);
  });
  it("serializes checks and notices an edit made during the first scan", async () => {
    let finish!: () => void;
    const blocked = new Promise<void>((done) => { finish = done; });
    const check = vi.fn<typeof runAnatomyCli>().mockImplementationOnce(async () => {
      await blocked;
      return ok(0);
    }).mockResolvedValue(ok(1));
    const watch = session(check);
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    watch.change("during-scan");
    await pause(60);
    expect(check).toHaveBeenCalledTimes(1);
    finish();
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(2));
    watch.controller.abort();
    expect((await watch.result)._unsafeUnwrap()).toBe(1);
  });
  it("continues after an operational error and recovers on the next edit", async () => {
    const check = vi.fn<typeof runAnatomyCli>()
      .mockResolvedValueOnce(err(new AnatomyDefinitionFileError("invalid JSON", "anatomy.json")))
      .mockResolvedValue(ok(0));
    const watch = session(check);
    await vi.waitFor(() => expect(watch.writeError).toHaveBeenCalledTimes(1));
    expect(JSON.parse(watch.writeError.mock.calls[0]![0]).operation).toBe("error");
    watch.change("fixed");
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(2));
    watch.controller.abort();
    expect((await watch.result)._unsafeUnwrap()).toBe(0);
  });
  it("stops waiting immediately and retains the last check result", async () => {
    const check = vi.fn<typeof runAnatomyCli>(async () => ok(2));
    const watch = session(check);
    await vi.waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    watch.controller.abort();
    expect((await watch.result)._unsafeUnwrap()).toBe(2);
    watch.change("after-stop");
    await pause(40);
    expect(check).toHaveBeenCalledTimes(1);
  });
  it.each(["--help", "--version"])("keeps %s one-shot", async (flag) => {
    const check = vi.fn<typeof runAnatomyCli>(async () => ok(0));
    const snapshot = vi.fn();
    expect((await runAnatomyWatch(["--watch", flag], new AbortController().signal, { check, snapshot }))._unsafeUnwrap()).toBe(0);
    expect(check).toHaveBeenCalledTimes(1);
    expect(snapshot).not.toHaveBeenCalled();
  });
  it("rejects query watch before any scan or snapshot", async () => {
    const check = vi.fn();
    const snapshot = vi.fn();
    expect((await runAnatomyWatch(["--watch", "--query", "."], new AbortController().signal, { check, snapshot })).isErr()).toBe(true);
    expect(check).not.toHaveBeenCalled();
    expect(snapshot).not.toHaveBeenCalled();
  });
});

describe("watch file selection", () => {
  it("tracks source edits, add/delete/rename, and empty directories", async () => {
    const file = join(temporary, "method.ts");
    writeFileSync(file, "export const a = 1;");
    const options = parseCliArguments([temporary, "--watch"])._unsafeUnwrap();
    const snapshot = async () => (await readWatchSnapshot(options))._unsafeUnwrap();
    const first = await snapshot();
    writeFileSync(file, "export const changed = 2;");
    const edited = await snapshot();
    expect(edited).not.toBe(first);
    renameSync(file, join(temporary, "renamed.ts"));
    const renamed = await snapshot();
    expect(renamed).not.toBe(edited);
    mkdirSync(join(temporary, "empty"));
    const added = await snapshot();
    expect(added).not.toBe(renamed);
    rmSync(join(temporary, "renamed.ts"));
    expect(await snapshot()).not.toBe(added);
  });
  it("ignores generated content but observes external definition changes", async () => {
    const target = join(temporary, "project");
    mkdirSync(join(target, "dist"), { recursive: true });
    mkdirSync(join(target, "generated"));
    const definition = join(temporary, "custom.json");
    writeFileSync(definition, "{}");
    const options = parseCliArguments([target, "--watch", "--definition", definition, "--ignore", "generated"])._unsafeUnwrap();
    const first = (await readWatchSnapshot(options))._unsafeUnwrap();
    writeFileSync(join(target, "dist/out.js"), "ignored");
    writeFileSync(join(target, "generated/out.js"), "ignored");
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).toBe(first);
    writeFileSync(definition, "invalid definition");
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).not.toBe(first);
  });
  it("detects closer discovered definitions and target deletion/recreation", async () => {
    const target = join(temporary, "target");
    mkdirSync(target);
    const options = parseCliArguments([target, "--watch"])._unsafeUnwrap();
    const first = (await readWatchSnapshot(options))._unsafeUnwrap();
    writeFileSync(join(temporary, "anatomy.json"), "{}");
    const ancestor = (await readWatchSnapshot(options))._unsafeUnwrap();
    expect(ancestor).not.toBe(first);
    writeFileSync(join(target, "anatomy.json"), "{}");
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).not.toBe(ancestor);
    rmSync(target, { recursive: true });
    const missing = (await readWatchSnapshot(options))._unsafeUnwrap();
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).toBe(missing);
    mkdirSync(target);
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).not.toBe(missing);
  });
  it("uses Git ignore rules and notices a force-added ignored file", async () => {
    execFileSync("git", ["init", "--quiet", temporary]);
    writeFileSync(join(temporary, ".gitignore"), "generated/\n");
    mkdirSync(join(temporary, "generated"));
    writeFileSync(join(temporary, "generated/out.ts"), "one");
    const options = parseCliArguments([temporary, "--watch", "--git-files"])._unsafeUnwrap();
    const first = (await readWatchSnapshot(options))._unsafeUnwrap();
    writeFileSync(join(temporary, "generated/out.ts"), "two edits");
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).toBe(first);
    execFileSync("git", ["-C", temporary, "add", "--force", "generated/out.ts"]);
    expect((await readWatchSnapshot(options))._unsafeUnwrap()).not.toBe(first);
  });
});
