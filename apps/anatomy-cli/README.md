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

## Generate rules with an LLM

```bash
anatomy config model --base-url https://your-provider.example/v1 --model your-model --api-key-env ANATOMY_API_KEY
anatomy config model --show
anatomy config model --help
anatomy ./src --generate --instructions "Infer shared service naming; tests are optional"
anatomy ./src --generate --output ./src/anatomy.json
```

Set the named API-key environment variable separately; credentials are not saved
in settings. Configuration uses the OS configuration directory, and
`--model-config <file>` selects a custom file for setup or generation.

The configured OpenAI-compatible Chat Completions model receives directory names,
structure, the actual Anatomy JSON Schema and your requirements, without source
file contents. It infers rules rather than freezing every observed path.
Candidates are validated locally, with at most one repair request. Structural
findings are reported separately so your requirements remain intact. Inspect the
JSON preview before adoption; `--output` refuses existing files. Run a normal
check after saving, including source export checks when applicable.

Generation supports normal ignores and `--git-files`, but not watch, query,
definition or bundle mode. JSON mode is on by default; configure `--no-json-mode`
if your provider rejects that parameter. Default timeout is 60 seconds, adjustable
with `--timeout-ms` (1000–300000). Context is limited to 200 KB and responses to 2 MB.

## Agent generation skill

```bash
anatomy skills install --agent codex,claude-code,pi
anatomy skills install --agent codex --scope project
anatomy skills install --agent claude-code --dry-run
anatomy skills install --path ./custom-skills
anatomy skills schema
```

Installs the bundled `generate-anatomy` skill, including its Chinese workflow,
format reference, reusable example and completion checklist. It uses the host
agent's model to inspect a folder and generate `anatomy.json`, with no separate
Anatomy model configuration or API key. Direct terminal generation via
`--generate` remains available. `skills schema` exports the actual input schema.

The default user roots are `~/.agents/skills` for Codex, `~/.claude/skills` for
Claude Code and `~/.pi/agent/skills` for pi. Project scope uses `.agents/skills`,
`.claude/skills` and `.pi/skills` under the current working directory. A custom
`--path` selects a skills root and cannot be combined with `--agent`.

Start a new session, or use `/reload` in pi. Invoke `$generate-anatomy` in Codex,
`/generate-anatomy ./src` in Claude Code, or `/skill:generate-anatomy ./src` in pi.
Tell it where to save the definition and any required project conventions.
See the [agent skill guide](https://github.com/forge-town/anatomy-cli#install-the-generation-skill-for-agents)
for the official agent references and bundled skill source.

Identical installs are idempotent. Changed existing skills and destination
symlinks are refused; preserve or remove the old copy explicitly before
replacing it. Resources are included in npm and retained by the one-shot CLI
installer after its download cache disappears. CLI uninstall leaves agent copies
in place.

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
