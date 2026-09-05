import { appendFileSync, constants, copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { err, ok, Result } from "neverthrow";
import { AnatomyInstallError } from "./install-options";

export const quoteShell = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export const getPathPlan = (bin: string, home: string, env: NodeJS.ProcessEnv) => {
  const shell = basename(env.SHELL ?? "sh");
  if (shell === "fish") {
    const config = env.XDG_CONFIG_HOME || join(home, ".config");
    const quoted = `'${bin.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
    return { profile: join(config, "fish", "config.fish"), line: `fish_add_path --prepend ${quoted}` };
  }
  const line = `export PATH=${quoteShell(bin)}:"$PATH"`;
  if (shell === "zsh") return { profile: join(env.ZDOTDIR || home, ".zshrc"), line };
  if (shell === "bash") {
    const loginProfile = [".bash_profile", ".bash_login", ".profile"].map((file) => join(home, file)).find(existsSync);
    return { profile: loginProfile ?? join(home, ".bashrc"), line };
  }
  return { profile: shell === "sh" ? join(home, ".profile") : null, line };
};

export const windowsPathScript = [
  '$ErrorActionPreference = "Stop"',
  '$bin = $env:ANATOMY_INSTALL_BIN',
  '$current = [Environment]::GetEnvironmentVariable("Path", "User")',
  '$entries = @($current -split ";" | Where-Object { $_ -and $_.TrimEnd("\\") -ine $bin.TrimEnd("\\") })',
  '[Environment]::SetEnvironmentVariable("Path", ((@($bin) + $entries) -join ";"), "User")',
].join("; ");

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
