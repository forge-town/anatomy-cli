# Preference-aware boot screen

## Problem

The server renders the product defaults (`zh` and light theme), while the browser reads saved preferences only after React mounts. A refresh therefore exposes the wrong language and theme before the selected values replace them.

## Direction

- Apply the saved theme in a small head script before the first browser paint.
- Keep the server and the first client i18n render on the same Chinese default to avoid a hydration mismatch.
- Hide product content behind a root boot screen while the saved language, fonts, and React updates settle.
- Reveal the page only after two paint frames; keep a short bounded opening duration so the transition reads intentionally.
- Use an Anatomy line-tree mark, existing `--line-*` tokens, and reduced-motion fallbacks.
- Preserve normal language and theme persistence after startup.

## Validation

- Refresh with English + dark and verify no visible Chinese/light page state.
- Refresh with Chinese + light and verify the selected state remains stable.
- Run type checking, linting, production build, and the 21st UI review.
