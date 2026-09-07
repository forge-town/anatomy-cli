import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { quoteShell } from "./quoteShell";

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
