# Anatomy CLI and SDK

Validate your repository's files and directories against an Anatomy definition.
Anatomy checks names, nesting, quantities, and alternatives, then reports
findings with `block`, `warn`, or `allow` severity.

[Documentation](https://anatomy.tools/docs) ·
[Source code](https://github.com/forge-town/anatomy-cli) ·
[简体中文](https://github.com/forge-town/anatomy-cli/blob/main/README.zh-CN.md)

## Requirements

Node.js 24 or newer on macOS, Linux, or Windows. The published CLI includes
its runtime bundle; Bun is only needed if you choose to use `bunx`.

## Install

Run one of these commands:

```bash
npx anatomy-cli
pnpm dlx anatomy-cli
bunx anatomy-cli
```

The installer copies the CLI to `~/.anatomy` and adds its `bin` directory to
a supported shell profile or Windows user PATH. Open a new terminal, then run:

```bash
anatomy --help
anatomy --version
```

Installation does not create an `anatomy.json` file. For installer options:

```bash
npx anatomy-cli --help
```

If you prefer an npm-managed global installation:

```bash
npm install -g --ignore-scripts anatomy-cli
```

## Usage

Add an `anatomy.json` definition to your project. See the
[definition guide](https://anatomy.tools/docs) and
[example definitions](https://github.com/forge-town/anatomy-cli/tree/main/apps/anatomy-cli/anatomies).

```bash
# Check the current directory
anatomy

# Check a target directory
anatomy ./src

# Use a definition with a custom name or location
anatomy ./src --definition ./config/service.anatomy.json

# Output JSON for CI
anatomy ./src --format json
```

Anatomy searches from the target directory upward for the closest `anatomy.json`.
You can also run a temporary check without installing the CLI:

```bash
npx anatomy-cli ./src
```

Exit codes:

- `0`: the target conforms.
- `1`: at least one finding has `block` severity.
- `2`: the definition or target could not be read.

## Upgrade or uninstall

```bash
# Upgrade the one-shot installation
npx anatomy-cli@latest

# Remove the one-shot installation
npx anatomy-cli --uninstall
```

If you installed with npm globally, use `npm uninstall -g anatomy-cli` instead.
For custom installation directories, PATH settings, and backups, see the
[installation guide](https://github.com/forge-town/anatomy-cli#install-anatomy).

## Watch mode

```bash
anatomy ./src --watch
anatomy . --git-files --watch
anatomy ./src --watch --format json
```

Checks run immediately and after changes to selected files or definitions. Watch
mode polls every 500 ms, coalesces edits, and runs complete checks serially. It
uses the same ignores and Git selection as normal checks, and also supports
`--bundle`. Configuration and source errors do not stop monitoring. Press Ctrl+C
to stop after the current check; the latest check determines the exit code.

JSON output is one report per stdout line (NDJSON), with operational errors on
stderr. Redirected report writes do not retrigger scans, but the report files
still count for structure checks. Keep reports outside the target or ignore them.
`--query` and `--watch` are mutually exclusive. Large repositories incur repeated
inventory and metadata reads.

## SDK

The same package also provides an ESM SDK, runtime schemas, and TypeScript types:

```bash
npm install anatomy-cli
```

```js
import { scanAnatomy, queryAnatomyBundle, validateAnatomyBundle } from "anatomy-cli";
```

See the [SDK guide](https://github.com/forge-town/anatomy-cli#composition-bundles-and-the-sdk)
for bundle definitions, inputs, and result handling.

## Support

Report issues on [GitHub](https://github.com/forge-town/anatomy-cli/issues).

License: MIT.
