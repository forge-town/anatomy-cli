# Preference-aware boot screen

## Problem

The server renders the product defaults (`zh` and light theme), while the browser reads saved preferences only after React mounts. A refresh therefore exposes the wrong language and theme before the selected values replace them.

## Direction

- Apply the saved theme in a small head script before the first browser paint.
- Keep the server and the first client i18n render on the same Chinese default to avoid a hydration mismatch.
- Hide product content behind a root boot screen while the saved language, fonts, and React updates settle.
- Reveal the page only after two paint frames; keep a short bounded opening duration so the transition reads intentionally.
- Show only one 2 px outlined inverted triangle whose geometric centroid is the rotation center. Give every 120-degree rotation a full 500 ms eased segment so it advances with a deliberate mechanical cadence, with no orbit, axes, nodes, wordmark, or supporting decoration.
- Keep the existing `--line-*` tokens and reduced-motion fallback.
- Preserve normal language and theme persistence after startup.

## Validation

- Refresh with English + dark and verify no visible Chinese/light page state.
- Refresh with Chinese + light and verify the selected state remains stable.
- Run type checking, linting, production build, and the 21st UI review.
