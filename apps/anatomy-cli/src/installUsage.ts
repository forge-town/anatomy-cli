export const installUsage = `Install Anatomy once, then run: anatomy ./src

  npm:   npx anatomy-cli
  pnpm:  pnpm dlx anatomy-cli
  Bun:   bunx anatomy-cli

Requires Node.js 24+. No administrator privileges or project changes.
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
