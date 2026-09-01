# Contributing

This repository is a Bun workspace. Install Bun 1.3 or newer, then run:

```bash
bun install --frozen-lockfile
bun run quality
```

The CLI lives in `apps/anatomy-cli`; reusable tree logic is in
`packages/anatomy`; schemas and bundled definitions live in the other two
workspace packages. Keep changes self-contained and add or update tests with
behavior changes.
