# Homepage redesign design

## Intent

Replace the previous generic landing page with a focused, high-contrast product stage for Anatomy CLI. The homepage should feel like an instrument panel for repository structure: an immersive dark hero, clear Chinese-first copy, and motion that responds to the pointer without requiring an external 3D runtime.

## Direction

The selected direction combines the pasted Galaxy hero composition with two proven experiments from `/Users/amin/projects/code-forge/apps/lab`: the flowing, pointer-deflected ribbons from `AetherRibbonMeshExperiment` and the staggered line-field rhythm from `BackgroundPathsExperiment`. The page keeps a restrained black / violet / cyan palette, uses Geist and Noto Sans SC for interface readability, and reserves bright cyan for actions and conformance signals.

The hero is a full viewport stage with a fixed translucent navigation bar, an absolute left-aligned content layer, a canvas motion field, orbit geometry, terminal card, and status card. A black negative-margin preview section follows the hero to preserve the reference's depth transition before the installation and workflow sections.

## Architecture and interaction

- `GalaxyHero` owns the visual stage and a local canvas renderer. Pointer movement bends the ribbon field and pointer down emits a short shockwave; reduced-motion preferences disable time-based movement.
- `PublicHeader` exposes a separate immersive mode so documentation routes retain their normal shell. Its dropdowns remain Base UI primitives and its mobile menu is keyboard accessible.
- `LanguageSwitcher` uses Base UI Select with `react-i18next`; the homepage and shared shell default to Simplified Chinese and switch as a complete unit to English. The language detector persists explicit choices in cookie/localStorage while omitting browser-language inference so a new visitor always starts in Chinese.
- The design intentionally avoids Spline at runtime. The tested package throws `ReactCurrentDispatcher` under this React 19 setup, so the local canvas provides a deterministic, inspectable fallback with no network dependency.

## Validation

TypeScript, oxlint, and production build must pass. Browser checks cover the 1280px desktop stage, 390px mobile layout, zero horizontal overflow, no runtime error logs, dropdown placement, CTA navigation, and both language states. The production preview is served at `http://127.0.0.1:5173/`.
