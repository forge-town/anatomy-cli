# Anatomy CLI

An open-source Bun monorepo for validating a repository file tree against a versioned Anatomy Draft definition.

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

## Install a published release

The commands below install the global `anatomy-cli` command from npm. They are
the five supported installation styles; the package must first be published as
`anatomy-cli` for the registry-based commands to resolve.

### macOS / Linux (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.sh | sh
```

### Windows (PowerShell)

```powershell
powershell -c "irm https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.ps1 | iex"
```

### npm

```bash
npm install -g --ignore-scripts anatomy-cli
```

### pnpm

```bash
pnpm add -g --ignore-scripts anatomy-cli
```

### Bun

```bash
bun add -g --ignore-scripts anatomy-cli
```

After any installation method, verify the command with:

```bash
anatomy-cli --help
```

## Quick start

To work from the open-source repository instead of a published release:

```bash
bun install --frozen-lockfile
bun run anatomy --help
bunx --no-install anatomy-cli --help
bun run anatomy \
  --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json \
  --target ./packages/schemas/src/anatomy
```

The example above checks one of the bundled definitions against this repository and
returns a passing result. The definitions under `apps/anatomy-cli/anatomies/` are
also available as concrete cases for projects that follow the CLI, service-file, or
Drizzle-table layouts.
The old Daedalus-only shortcuts for its private models, services, and application
packages were intentionally not carried over; pass your own target with `--target`.

Use `--format json` for CI integrations and repeat `--ignore` for additional directory names. Exit codes are stable:

- `0` — the target conforms
- `1` — one or more findings have `block` severity
- `2` — the definition or target could not be read

Anatomy JSON definitions only need the human-readable metadata and structural
constraints. Node `id` values and empty `policyOverrides` objects may be omitted;
the schema generates IDs and defaults policy overrides while reading the file. See
[`cli-source.anatomy.json`](./apps/anatomy-cli/anatomies/cli-source.anatomy.json) for
a complete case built from this project's `apps/anatomy-cli/src` directory.

## Development

```bash
bun run quality
bun run build
```

The workspace is self-contained: it has no path or workspace dependency on
Daedalus. The implementation was copied from the Daedalus Anatomy CLI and its
direct Anatomy dependencies. The schemas package contains the complete Anatomy
schema surface required by the CLI; unrelated Daedalus product domains are not
part of this standalone project. The original Daedalus repository is kept
outside this workspace and is not modified by this project.

## Publishing

The root package is intentionally private. To publish a CLI release, authenticate
with npm and publish the app workspace with Bun; Bun replaces local `workspace:`
references while packing and the prepack hook creates the Node.js bundle:

```bash
cd apps/anatomy-cli
bun publish --access public
```
