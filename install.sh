#!/bin/sh

set -eu

package_name="${ANATOMY_CLI_PACKAGE:-@anatomy-cli/cli}"
package_version="${ANATOMY_CLI_VERSION:-latest}"
package_spec="${ANATOMY_CLI_SPEC:-${package_name}@${package_version}}"

printf '%s\n' "Installing ${package_spec}..."

if command -v npm >/dev/null 2>&1; then
  npm install --global --ignore-scripts "$package_spec"
elif command -v pnpm >/dev/null 2>&1; then
  pnpm add --global --ignore-scripts "$package_spec"
elif command -v bun >/dev/null 2>&1; then
  bun add --global --ignore-scripts "$package_spec"
else
  printf '%s\n' "Anatomy CLI needs npm, pnpm, or Bun. Install Node.js (npm) or Bun, then run this installer again." >&2
  exit 1
fi

printf '\n%s\n' "Anatomy CLI installed. Run: anatomy-cli --help"
