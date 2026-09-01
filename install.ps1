$ErrorActionPreference = "Stop"

$packageName = if ($env:ANATOMY_CLI_PACKAGE) { $env:ANATOMY_CLI_PACKAGE } else { "@anatomy-cli/cli" }
$packageVersion = if ($env:ANATOMY_CLI_VERSION) { $env:ANATOMY_CLI_VERSION } else { "latest" }
$packageSpec = if ($env:ANATOMY_CLI_SPEC) { $env:ANATOMY_CLI_SPEC } else { "$packageName@$packageVersion" }

Write-Host "Installing $packageSpec..."

if (Get-Command npm -ErrorAction SilentlyContinue) {
  & npm.cmd install --global --ignore-scripts $packageSpec
} elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
  & pnpm.cmd add --global --ignore-scripts $packageSpec
} elseif (Get-Command bun -ErrorAction SilentlyContinue) {
  & bun.exe add --global --ignore-scripts $packageSpec
} else {
  throw "Anatomy CLI needs npm, pnpm, or Bun. Install Node.js (npm) or Bun, then run this installer again."
}

Write-Host ""
Write-Host "Anatomy CLI installed. Run: anatomy-cli --help"
