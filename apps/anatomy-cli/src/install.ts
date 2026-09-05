import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { err, ok, Result } from "neverthrow";
import { AnatomyInstallError, type InstallOptions } from "./install-options";
import { configurePath, getPathPlan } from "./install-path";

const markerName = "install.json";
const owner = "anatomy-cli/installer-v1";

export type InstallContext = {
  packageRoot: string;
  home: string;
  platform: NodeJS.Platform;
  nodeVersion: string;
  nodeExecutable: string;
  env: NodeJS.ProcessEnv;
};

export const posixLauncher = '#!/bin/sh\nexec node "$(dirname "$0")/../anatomy.mjs" "$@"\n';
export const windowsLauncher = '@echo off\r\nnode "%~dp0..\\anatomy.mjs" %*\r\nexit /b %errorlevel%\r\n';

export const runInstallation = (
  options: InstallOptions,
  context: InstallContext,
): Result<string[], AnatomyInstallError> => {
  if (Number(context.nodeVersion.split(".")[0]) < 18) return err(new AnatomyInstallError("Anatomy requires Node.js 18 or newer."));
  if (!["darwin", "linux", "win32"].includes(context.platform)) return err(new AnatomyInstallError(`Unsupported platform: ${context.platform}`));
  const prefix = options.prefix;
  const bin = join(prefix, "bin");
  const marker = join(prefix, markerName);
  const launcher = join(bin, context.platform === "win32" ? "anatomy.cmd" : "anatomy");
  const ownership = Result.fromThrowable(() => {
    if (existsSync(marker)) return JSON.parse(readFileSync(marker, "utf8"))?.owner === owner;
    return !existsSync(prefix) || readdirSync(prefix).length === 0;
  }, (cause) => new AnatomyInstallError(`Could not inspect ${prefix}.`, { cause }))();
  if (ownership.isErr()) return err(ownership.error);
  if (!ownership.value) return err(new AnatomyInstallError(`Refusing to change ${prefix}: it is not an Anatomy-managed install directory.`));

  if (options.uninstall) {
    if (!existsSync(marker)) return err(new AnatomyInstallError(`No managed Anatomy installation at ${prefix}.`));
    return Result.fromThrowable(() => {
      rmSync(launcher, { force: true });
      rmSync(join(prefix, "anatomy.mjs"), { force: true });
      return ["Anatomy uninstalled. Your project files were not changed.", `Shell PATH settings and profile backups were kept. You can remove the Anatomy PATH entry for ${bin}.`];
    }, (cause) => new AnatomyInstallError(`Could not uninstall Anatomy from ${prefix}.`, { cause }))();
  }

  let stage: string | undefined;
  const prepared = Result.fromThrowable(() => {
    const bundle = join(context.packageRoot, "dist", "main.js");
    if (!existsSync(bundle)) throw new AnatomyInstallError("This release has no CLI bundle. Build the package before installing it.");
    mkdirSync(prefix, { recursive: true });
    stage = mkdtempSync(join(prefix, ".install-"));
    const payload = join(stage, "anatomy.mjs");
    copyFileSync(bundle, payload);
    writeFileSync(join(stage, "launcher"), context.platform === "win32" ? windowsLauncher : posixLauncher);
    chmodSync(join(stage, "launcher"), 0o755);
    return payload;
  }, (cause) => new AnatomyInstallError("Could not prepare the Anatomy installation.", { cause }))();

  const installed = prepared.andThen((payload) => {
    const check = spawnSync(context.nodeExecutable, [payload, "--help"], { env: context.env, encoding: "utf8" });
    if (check.error || check.status !== 0 || !check.stdout.includes("Usage: anatomy")) {
      return err(new AnatomyInstallError(`CLI verification failed; the installed CLI was not replaced. ${check.error?.message ?? check.stderr}`));
    }
    return Result.fromThrowable(() => {
      mkdirSync(bin, { recursive: true });
      writeFileSync(join(stage!, markerName), JSON.stringify({ owner }, null, 2));
      renameSync(payload, join(prefix, "anatomy.mjs"));
      renameSync(join(stage!, "launcher"), launcher);
      renameSync(join(stage!, markerName), marker);
      return undefined;
    }, (cause) => new AnatomyInstallError(`Could not activate Anatomy in ${prefix}.`, { cause }))();
  });

  const cleaned = Result.fromThrowable(() => {
    if (stage) rmSync(stage, { recursive: true, force: true });
  }, (cause) => new AnatomyInstallError(`Could not remove the installer staging directory ${stage}.`, { cause }))();
  if (installed.isErr()) return err(installed.error);
  if (cleaned.isErr()) return err(cleaned.error);

  const messages = [`Anatomy installed in ${prefix}.`];
  if (options.modifyPath) {
    configurePath(bin, context.home, context.platform, context.env).match(
      (message) => messages.push(message),
      (error) => messages.push(`PATH setup needs attention: ${error.message}`),
    );
  } else {
    messages.push(context.platform === "win32"
      ? `PATH was not changed. Add ${bin} to your user PATH.`
      : `PATH was not changed. Run: ${getPathPlan(bin, context.home, context.env).line}`);
  }
  messages.push("Then run: anatomy ./src", "Keep anatomy.json in your repository; installation does not create or change it.");
  return ok(messages);
};
