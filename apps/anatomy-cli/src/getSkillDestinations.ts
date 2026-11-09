import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { Result } from "neverthrow";
import { AnatomySkillInstallError } from "./AnatomySkillInstallError.js";

export const getSkillDestinations = (args: string[], home = homedir(), cwd = process.cwd()) => Result.fromThrowable(() => {
  const agents: string[] = [];
  let scope = "user";
  let custom: string | undefined;
  let dryRun = false;
  for (let index = 0; index < args.length; index++) {
    const option = args[index]!;
    if (option === "--dry-run") { dryRun = true; continue; }
    if (!["--agent", "--scope", "--path"].includes(option)) throw new AnatomySkillInstallError(`Unknown skill option: ${option}`);
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new AnatomySkillInstallError(`${option} requires a value`);
    if (option === "--agent") agents.push(...value.split(",").map((agent) => agent.trim()));
    else if (option === "--scope") scope = value;
    else custom = value;
  }
  if (!["user", "project"].includes(scope)) throw new AnatomySkillInstallError("--scope must be user or project");
  if (custom && (agents.length || scope !== "user")) throw new AnatomySkillInstallError("--path cannot be combined with --agent or --scope project");
  if (!custom && !agents.length) throw new AnatomySkillInstallError("Choose --agent codex,claude-code,pi or --path <skills-directory>");
  const roots: Record<string, string> = scope === "user"
    ? { codex: join(home, ".agents", "skills"), "claude-code": join(home, ".claude", "skills"), pi: join(home, ".pi", "agent", "skills") }
    : { codex: join(cwd, ".agents", "skills"), "claude-code": join(cwd, ".claude", "skills"), pi: join(cwd, ".pi", "skills") };
  const destinations = custom ? [join(resolve(cwd, custom), "generate-anatomy")] : agents.map((agent) => {
    if (!roots[agent]) throw new AnatomySkillInstallError(`Unsupported agent ${agent}; use codex, claude-code or pi`);
    return join(roots[agent], "generate-anatomy");
  });
  return { destinations: [...new Set(destinations)], dryRun };
}, (cause) => cause instanceof AnatomySkillInstallError ? cause : new AnatomySkillInstallError("Cannot resolve skill destinations", { cause }))();
