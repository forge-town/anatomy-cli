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

The workspace is Bun-first: package entry points intentionally reference the
TypeScript source files, so use Bun to run and develop it rather than treating
the workspace as a precompiled Node/npm distribution.

## Quick start

```bash
bun install
bun run apps/anatomy-cli/src/main.ts --help
bunx --no-install anatomy-cli --help
bun run apps/anatomy-cli/src/main.ts \\
  --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json \\
  --target ./packages/schemas/src/anatomy
```

The example above checks one of the bundled definitions against this repository and
returns a passing result. The two definitions under `apps/anatomy-cli/anatomies/`
are also available for projects that follow the service-file or Drizzle-table layout.
The old Daedalus-only shortcuts for its private models, services, and application
packages were intentionally not carried over; pass your own target with `--target`.

Use `--format json` for CI integrations and repeat `--ignore` for additional directory names. Exit codes are stable:

- `0` — the target conforms
- `1` — one or more findings have `block` severity
- `2` — the definition or target could not be read

## Development

```bash
bun run quality
```

The workspace is self-contained: it has no path or workspace dependency on
Daedalus. The implementation was copied from the Daedalus Anatomy CLI and its
direct Anatomy dependencies. The schemas package contains the complete Anatomy
schema surface required by the CLI; unrelated Daedalus product domains are not
part of this standalone project. The original Daedalus repository is kept
outside this workspace and is not modified by this project.
