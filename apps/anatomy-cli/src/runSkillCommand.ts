import { lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod/v4";
import { ResultAsync } from "neverthrow";
import { AnatomyDraftInputSchema } from "@anatomy-cli/schemas";
import { AnatomySkillFiles } from "./AnatomySkillFiles.js";
import { AnatomySkillInstallError } from "./AnatomySkillInstallError.js";
import { getSkillDestinations } from "./getSkillDestinations.js";

export const runSkillCommand = (
  args: string[],
  writeOutput: (value: string) => void = (value) => process.stdout.write(`${value}\n`),
  context = { home: homedir(), cwd: process.cwd(), runtimeUrl: import.meta.url },
) => ResultAsync.fromPromise((async () => {
  if (args.includes("--help") || args.includes("-h")) {
    writeOutput("Usage: anatomy skills install --agent codex,claude-code,pi [--scope user|project] [--dry-run]\n       anatomy skills install --path <skills-root> [--dry-run]\n       anatomy skills schema\nSkill: generate-anatomy. Existing changed skill directories are never overwritten.");
    return 0;
  }
  if (args.length === 1 && args[0] === "schema") {
    writeOutput(JSON.stringify(z.toJSONSchema(AnatomyDraftInputSchema, { io: "input" }), null, 2));
    return 0;
  }
  if (args[0] !== "install") throw new AnatomySkillInstallError("Use anatomy skills install or anatomy skills schema");
  const options = getSkillDestinations(args.slice(1), context.home, context.cwd);
  if (options.isErr()) throw options.error;
  const entry = fileURLToPath(context.runtimeUrl);
  const packageRoot = basename(entry) === "anatomy.mjs" ? dirname(entry) : resolve(dirname(entry), "..");
  const source = join(packageRoot, "skills", "generate-anatomy");
  const resources = await Promise.all(AnatomySkillFiles.map(async (file) => ({ file, text: await readFile(join(source, file), "utf8") })));
  const pending: string[] = [];
  for (const destination of options.value.destinations) {
    const existing = await ResultAsync.fromPromise(lstat(destination), (cause) => cause as NodeJS.ErrnoException);
    if (existing.isErr()) {
      if (existing.error.code !== "ENOENT") throw new AnatomySkillInstallError(`Cannot inspect ${destination}`);
      pending.push(destination);
      continue;
    }
    if (!existing.value.isDirectory() || existing.value.isSymbolicLink()) throw new AnatomySkillInstallError(`Refusing existing non-directory or symlink: ${destination}`);
    for (const resource of resources) {
      const content = await ResultAsync.fromPromise(readFile(join(destination, resource.file), "utf8"), () => new AnatomySkillInstallError(`Existing skill differs at ${destination}; preserve or remove it explicitly before reinstalling.`));
      if (content.isErr()) throw content.error;
      if (content.value !== resource.text) throw new AnatomySkillInstallError(`Existing skill differs at ${destination}; it was not overwritten.`);
    }
  }
  if (options.value.dryRun) {
    for (const destination of options.value.destinations) writeOutput(`Would install generate-anatomy at ${destination}`);
    return 0;
  }
  for (const destination of pending) {
    await mkdir(dirname(destination), { recursive: true });
    const stage = await mkdtemp(join(dirname(destination), ".anatomy-skill-"));
    const installed = await ResultAsync.fromPromise((async () => {
      for (const resource of resources) {
        const path = join(stage, resource.file);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, resource.text, { flag: "wx" });
      }
      await rename(stage, destination);
    })(), (cause) => new AnatomySkillInstallError(`Could not install skill at ${destination}`, { cause }));
    const cleaned = await ResultAsync.fromPromise(rm(stage, { recursive: true, force: true }), (cause) => new AnatomySkillInstallError(`Could not clean staging directory ${stage}`, { cause }));
    if (installed.isErr()) throw installed.error;
    if (cleaned.isErr()) throw cleaned.error;
    writeOutput(`Installed generate-anatomy at ${destination}`);
  }
  for (const destination of options.value.destinations.filter((path) => !pending.includes(path))) writeOutput(`Already installed: ${destination}`);
  writeOutput("Reload skills or start a new agent session, then ask generate-anatomy to generate anatomy.json for your target folder.");
  return 0;
})(), (cause) => cause instanceof AnatomySkillInstallError ? cause : new AnatomySkillInstallError("Skill installation failed. Check resources and destination permissions; earlier successful targets may already be installed.", { cause }));
