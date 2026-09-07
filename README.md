# Anatomy

**English** | [简体中文](./README.zh-CN.md)

[anatomy.tools](https://anatomy.tools) is an open-source tool for validating a repository file tree against a versioned Anatomy definition. Read the full guide at [anatomy.tools/docs](https://anatomy.tools/docs).

## Workspace layout

- `apps/anatomy-cli` — command-line interface and filesystem adapter
- `packages/anatomy` — immutable Anatomy tree utilities and the conformance engine
- `packages/schemas` — runtime-validated Anatomy Draft schemas (the `anatomy`
  domain is the public surface of this standalone workspace)
- `packages/anatomy-cli-config` — reusable example Anatomy definitions

The migration keeps the original boundaries: the Daedalus CLI becomes the app,
the tree/checking engine becomes `packages/anatomy`, and only its Anatomy schema
closure is kept in `packages/schemas`. Internal Daedalus workspace aliases are
replaced with the standalone `@anatomy-cli/*` scope.

The implementation is intentionally based on a structured file tree, not on ad-hoc source inspection:

```text
JSON Anatomy Draft
        ↓
deterministic filesystem tree
        ↓
name / nesting / quantity / one-of checks
        ↓
block · warn · allow result
```

## Requirements

- Bun 1.3 or newer
- Node.js 18 or newer for the published CLI package when it is installed with npm or pnpm

The repository is Bun-first for development. Published CLI releases are bundled
as a standalone Node.js entry point, so registry installs do not need Bun.

## Install Anatomy

Run **one** of these commands once, then use `anatomy` directly:

```bash
npx anatomy-cli
pnpm dlx anatomy-cli
bunx anatomy-cli
```

The one-shot installer requires Node.js 18+ on macOS, Linux or Windows. It
copies the standalone CLI bundled in the downloaded `anatomy-cli` release to
`~/.anatomy`, so it keeps working after the package manager clears its cache.
No second package download, administrator privileges, or project dependency
changes are needed. The package name stays `anatomy-cli`; the everyday command
is `anatomy`.

The installer adds its `bin` directory to a supported shell profile or Windows
user PATH. Existing profile content is preserved, with a `.anatomy-backup`
before the first edit. **Open a new terminal** after installation, then run:

```bash
anatomy --help
anatomy ./src
```

Installation does not generate `anatomy.json`; keep your definition in the
repository as described below. Unknown shells and read-only profiles receive
manual PATH instructions instead of a silent setup failure.

### Upgrade, customize or uninstall

```bash
# Install the latest published release
pnpm dlx anatomy-cli@latest

# Inspect installer options without changing anything
pnpm dlx anatomy-cli --help

# Let your environment manage PATH (use an absolute prefix)
pnpm dlx anatomy-cli --prefix /absolute/path/to/anatomy --no-modify-path

# Remove this installer's CLI; leaves projects, PATH settings and backups alone
pnpm dlx anatomy-cli --uninstall
```

Use the same `--prefix` when upgrading or uninstalling a custom installation.
`ANATOMY_INSTALL_DIR` also sets the prefix, and `ANATOMY_NO_MODIFY_PATH=1`
disables profile edits. The installer rejects non-empty, unowned directories.
After uninstall, optionally remove the Anatomy PATH entry from your shell
profile or Windows user PATH. An installation marker is retained so the
dedicated directory can safely be reused.

If you prefer package-manager-managed global installs, these still work:

```bash
npm install -g --ignore-scripts anatomy-cli
pnpm add -g --ignore-scripts anatomy-cli
bun add -g --ignore-scripts anatomy-cli
```

These installs use the package manager's global directory and should be
removed with that package manager, not the one-shot installer's `--uninstall`.
Passing a target to `anatomy-cli` still runs a temporary check:
`pnpm dlx anatomy-cli ./src`. The `anatomy` command always runs a check, including
when no target is provided.

## Quick start

Place an `anatomy.json` in the directory you want to check or one of its parent
directories, then pass the target directly to Anatomy:

```bash
anatomy ./src
```

Run `anatomy` with no target to check the current directory. Anatomy walks up
from the target and uses the closest `anatomy.json`. Use `--definition` only
when the definition has another name or location:

```bash
anatomy ./src --definition ./config/service.anatomy.json
```

To work from the open-source repository instead of a published release:

```bash
bun install --frozen-lockfile
bun run anatomy --help
bun run anatomy ./packages/schemas/src/anatomy \
  --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json
```

The example above checks one of the bundled definitions against this repository;
its exit code reflects whether the current tree still matches that definition. The
definitions under `apps/anatomy-cli/anatomies/` are also available as concrete
cases for projects that follow the CLI, service-file, or Drizzle-table layouts.
The old Daedalus-only shortcuts for its private models, services, and application
packages were intentionally not carried over; pass your target as the first argument.

Use `--format json` for CI integrations and repeat `--ignore` for additional directory names. Exit codes are stable:

- `0` — the target conforms
- `1` — one or more findings have `block` severity
- `2` — the definition or target could not be read

Anatomy JSON definitions only need the human-readable metadata and structural
constraints. Node `id` values and empty `policyOverrides` objects may be omitted;
the schema generates IDs and defaults policy overrides while reading the file. See
[`cli-source.anatomy.json`](./apps/anatomy-cli/anatomies/cli-source.anatomy.json) for
a complete case built from this project's `apps/anatomy-cli/src` directory.

### Constrain placeholder names

Use `structure.bindings` to constrain the value captured by a placeholder. A
binding can use one built-in format, a custom regular expression, or both:

```json
{
  "structure": {
    "schemaVersion": 1,
    "defaultPolicies": {
      "missingRequired": "block",
      "unexpectedEntry": "warn",
      "nameMismatch": "warn",
      "nestingMismatch": "block"
    },
    "bindings": {
      "Name": {
        "format": "PascalCase",
        "pattern": "[A-Z][A-Za-z0-9]*"
      }
    },
    "root": {
      "children": [
        {
          "kind": "directory",
          "name": { "type": "placeholder", "value": "<Name>Service" },
          "quantity": "exactly_one",
          "children": [
            {
              "kind": "file",
              "name": { "type": "placeholder", "value": "<Name>Service.ts" },
              "quantity": "exactly_one"
            }
          ]
        }
      ]
    }
  }
}
```

The supported built-ins are `PascalCase`, `camelCase`, `kebab-case`,
`snake_case`, and `SCREAMING_SNAKE_CASE`. Custom patterns are full matches even
when `^` and `$` are omitted. A placeholder captured by a directory is reused
by matching descendants; each repeated directory gets its own captured value.

## Agent workflow (source checkout)

Query the definition before editing, then check the resulting file tree. These
commands use this checkout; the query interface requires a future CLI release
before it is available in registry installs.

```bash
# Use the same target root and definition for both operations.
# The queried path is relative to the target root and may not exist yet.
bun run anatomy ./packages/services --query src/UserService/UserService.ts \
  --definition ./apps/anatomy-cli/anatomies/service-files.anatomy.json --format json

# After the Agent creates or edits the module:
bun run anatomy ./packages/services \
  --definition ./apps/anatomy-cli/anatomies/service-files.anatomy.json --format json
```

Replace `./packages/services` with an existing directory in your repository.
Omit `--definition` to use the nearest `anatomy.json`, as with normal checks.
The definition root always describes the directory passed as `target`; finding
a definition in a parent does not change that root. `--query .` returns root
constraints. Relative Windows separators are accepted; absolute paths and `..`
segments in the query are rejected. Query mode reads the target to surface
filesystem errors, but never creates files or changes the definition.

Omit `--format json` for a readable summary of required files, quantities,
inherited names, policies and conditional one-of alternatives. This summary
describes constraints; it does not certify that the files pass validation.

Query JSON uses `contractVersion: 1`, `operation: "query"`, and these statuses:

| Status | Meaning |
| --- | --- |
| `resolved` | A declared rule was found, or root constraints were requested. This is not a validation pass. |
| `unmatched` | No entry rule matched at `scopePath`; that parent's `unexpectedEntry` policy still applies. Undeclared directory descendants are not checked. |
| `mismatch` | A name, binding, or intermediate entry kind conflicts with the declared structure. |
| `ambiguous` | Multiple rules may consume the entry; inspect `matches` and `rules`. Validation uses definition order, entry kinds and siblings. |

Responses include the absolute definition and target paths, effective policies,
captured placeholder values, binding constraints, ancestor quantities, applicable
rules and containing one-of groups. Directory rules retain their child structure.
Use `captures` to substitute inherited placeholders in descendants; one-of
alternatives are conditional, not a list of files that must all be created.
Always run a check to evaluate quantities, sibling alternatives and actual kinds.

Check JSON preserves `conforms`, `summary`, and the existing issue fields, adding
`contractVersion: 1`, `operation: "check"`, definition/target metadata and
`ignoredNames`. Each issue adds `rulePath` (a JSON Pointer into the definition),
`expected` (the declared node), and `actual` (observed entry summaries). For
missing-entry and one-of issues, `actual` lists siblings in the affected directory.
Unexpected entries have null `rulePath` and `expected`. Use `rulePath` to correlate
query and check results for the same definition revision: omitted IDs are generated
anew when parsing, and array indices can change when the definition is edited.

A completed query exits `0` for every query status; inspect `status` before
editing. Checks retain `0` for no blocking findings and `1` for blocking findings.
Operational errors exit `2`; with `--format json`, stderr contains an
`operation: "error"` JSON object and stdout has no success report. Missing or
invalid definitions, unsupported schema versions, unknown fields and unreadable
targets are errors, not an absence of constraints. Unknown definition fields are
now rejected instead of silently removed; fix spelling or use supported version-1
rules. Human check output and legacy target/definition flags remain supported.

Queries describe declared structure independently of scan exclusions, so `--ignore`
is only accepted for checks. Checks continue to skip symbolic links and default
generated directories, including `node_modules` and `dist`; the report lists
ignored names. A structural pass only covers the collected tree and executed
rules. Run type checks and behavior tests separately.

## Development

```bash
bun run quality
bun run build
```

The workspace is self-contained: it has no path or workspace dependency on
Daedalus. The implementation was copied from the original Daedalus tooling and its
direct Anatomy dependencies. The schemas package contains the complete Anatomy
schema surface required by the CLI; unrelated Daedalus product domains are not
part of this standalone project. The original Daedalus repository is kept
outside this workspace and is not modified by this project.

## Publishing

The one-shot installer must be published in a new `anatomy-cli` release before
the registry commands above gain this behavior; the existing 0.0.2 release
predates it. Do not deploy homepage installer instructions ahead of that release.

The root package is intentionally private. To publish a CLI release, authenticate
with npm and publish the app workspace with Bun; Bun replaces local `workspace:`
references while packing and the prepack hook creates the Node.js bundle:

```bash
cd apps/anatomy-cli
bun publish --access public
```

The package's `bin` entries must stay distinct: `anatomy-cli` dispatches to the
installer by default; `anatomy` dispatches to the checker. Publish the three
bundles (`main.js`, `index.js`, `install-main.js`) and the `bin/` launchers
together. No separate installer package or install lifecycle script is needed.
