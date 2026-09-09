import { err, ok, Result } from "neverthrow";
import { spawnSync } from "node:child_process";
import { appendFileSync, constants, copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { AnatomyInstallError } from "./AnatomyInstallError";
import { getPathPlan } from "./getPathPlan";
import { windowsPathScript } from "./windowsPathScript";

export const configurePath = (
  bin: string,
  home: string,
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
): Result<string, AnatomyInstallError> => {
  if (platform === "win32") {
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", windowsPathScript], {
      env: { ...env, ANATOMY_INSTALL_BIN: bin }, encoding: "utf8", windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      return err(new AnatomyInstallError(`Could not update user PATH. Add ${bin} to your user PATH manually. ${result.error?.message ?? result.stderr}`));
    }
    return ok("Updated Windows user PATH. Open a new terminal to use anatomy.");
  }
  const plan = getPathPlan(bin, home, env);
  if (!plan.profile) return err(new AnatomyInstallError(`Unsupported shell. Add ${bin} to your PATH manually.`));
  const profile = plan.profile;
  return Result.fromThrowable(() => {
    const existing = existsSync(profile) ? readFileSync(profile, "utf8") : "";
    if (!existing.split(/\r?\n/).includes(plan.line)) {
      mkdirSync(dirname(profile), { recursive: true });
      const backup = `${profile}.anatomy-backup`;
      if (existsSync(profile) && !existsSync(backup)) copyFileSync(profile, backup, constants.COPYFILE_EXCL);
      appendFileSync(profile, `\n# Anatomy\n${plan.line}\n`);
    }
    return `PATH configured in ${profile}. Open a new terminal to use anatomy.`;
  }, (cause) => new AnatomyInstallError(`Could not configure ${profile}. Add this manually: ${plan.line}`, { cause }))();
};
