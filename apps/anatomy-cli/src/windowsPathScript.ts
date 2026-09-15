export const windowsPathScript = [
  '$ErrorActionPreference = "Stop"',
  '$bin = $env:ANATOMY_INSTALL_BIN',
  '$current = [Environment]::GetEnvironmentVariable("Path", "User")',
  '$entries = @($current -split ";" | Where-Object { $_ -and $_.TrimEnd("\\") -ine $bin.TrimEnd("\\") })',
  '[Environment]::SetEnvironmentVariable("Path", ((@($bin) + $entries) -join ";"), "User")',
].join("; ");
