import { homedir } from "node:os";
import { isAbsolute, join, parse, resolve } from "node:path";
import { err, ok, type Result } from "neverthrow";

export class AnatomyInstallError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AnatomyInstallError";
  }
}

export type InstallOptions = {
  prefix: string;
  modifyPath: boolean;
  uninstall: boolean;
  help: boolean;
};

export const installUsage = `Install Anatomy once, then run: anatomy ./src

  npm:   npx anatomy-cli
  pnpm:  pnpm dlx anatomy-cli
  Bun:   bunx anatomy-cli

Requires Node.js 18+. No administrator privileges or project changes.
Downloads are handled by your package manager; the installer copies this release.

Options:
  --prefix <directory>  Install directory (default: ~/.anatomy)
  --no-modify-path      Leave shell profiles and user PATH unchanged
  --uninstall           Remove the managed CLI from the install directory
  --install             Explicitly select the installer
  -h, --help            Show this help without changing anything

Rerun the installer with anatomy-cli@latest to upgrade.
For a one-off check instead: anatomy-cli ./src
`;

export const parseInstallOptions = (
  args: string[],
  home = homedir(),
  env: NodeJS.ProcessEnv = process.env,
): Result<InstallOptions, AnatomyInstallError> => {
  const options: InstallOptions = {
    prefix: env.ANATOMY_INSTALL_DIR || join(home, ".anatomy"),
    modifyPath: env.ANATOMY_NO_MODIFY_PATH !== "1",
    uninstall: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--install") continue;
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--uninstall") options.uninstall = true;
    else if (arg === "--no-modify-path") options.modifyPath = false;
    else if (arg === "--prefix") {
      const value = args[++index];
      if (!value || value.startsWith("--")) return err(new AnatomyInstallError("--prefix requires a directory."));
      options.prefix = value;
    } else return err(new AnatomyInstallError(`Unknown installer option: ${arg}`));
  }
  if (!isAbsolute(options.prefix)) {
    return err(new AnatomyInstallError("Use an absolute --prefix directory."));
  }
  options.prefix = resolve(options.prefix);
  if (options.prefix === parse(options.prefix).root || options.prefix === resolve(home)) {
    return err(new AnatomyInstallError("Choose a dedicated install directory, not your home or filesystem root."));
  }
  if (/[\r\n\0]/.test(options.prefix)) return err(new AnatomyInstallError("The install directory cannot contain control characters."));
  return ok(options);
};
