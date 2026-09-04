# Startup local CLI and CI/CD flow

## Intent

Separate the local CLI workflow from CI/CD adoption so the landing page
introduces concepts in the order a user encounters them. The capabilities
section should first explain how to define and check a repository locally. A
following section should then show how the same deterministic check becomes an
automated pull-request gate.

## Design

- Keep `StartupFeatures` focused on the local workflow: define the structure,
  run the CLI against the real file tree, and read the result.
- Remove CI, pull-request, and commit language from the local section's title,
  description, and three steps.
- Add a separate `StartupCiSection` after the local workflow and before the
  final CTA.
- Present the CI/CD section as a two-column linear composition: product copy
  and the `0 / 1 / 2` exit-code contract on one side, a real GitHub Actions
  workflow excerpt on the other.
- Link to the existing `/docs/ci` guide for the complete setup.
- Reuse the current border, surface, foreground, muted, success, and accent
  tokens so the section works in both themes without a new visual system.

## Content and data flow

The section is static and has no client state. Both sections read mirrored
strings from the existing `startup` i18n namespace. The workflow example is
based on the repository's current CI documentation and demonstrates the
existing stable exit codes and JSON output rather than implying a proprietary
integration.

## Error handling and accessibility

No runtime error path is introduced. The workflow preview uses semantic code
markup, the exit codes are a list, and the documentation link has visible text
and a keyboard focus target. Decorative labels remain hidden from assistive
technology only when they repeat adjacent readable content.

## Validation

- Verify the local section contains no CI, pull-request, or commit wording.
- Verify the CI/CD section renders between the local workflow and final CTA.
- Check the desktop two-column and mobile single-column layouts.
- Confirm `/docs/ci` is reachable and both locale files retain matching
  `startup` keys.
- Run docs typecheck, lint, production build, and `git diff --check`.
