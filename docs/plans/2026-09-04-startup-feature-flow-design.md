# Startup feature flow

## Intent

Make the capabilities section read as one continuous product story instead of
three unrelated cards. The section should explain the contract lifecycle in a
single pass: define the repository shape, verify the real file tree, and ship
the same deterministic check with every change.

## Design

- Replace the independent card framing with one three-step workflow rail.
- Place numbered circular nodes on a continuous horizontal track at desktop
  sizes; collapse the track into a vertical path on small screens.
- Keep the existing command, JSON, and result previews as the evidence under
  each step, without adding colored panels that split the section into zones.
- Use a restrained moving accent on the track to guide the eye from step one
  to step three. The animation is decorative, pointer-free, and disabled for
  reduced-motion users.
- Rewrite the localized titles and descriptions so the language follows the
  same order as the visual route: “先定义结构 → 再核对真实文件树 → 最后
  接入每次提交”.

## Implementation details

`StartupFeatures.tsx` owns the flow rail and renders each stage through a
shared `CapabilityCard` primitive. The primitive contains the numbered node,
stage metadata, narrative copy, and the existing evidence preview. The rail is
decorative (`aria-hidden`) and is styled in `styles.css`, where a shared
horizontal track becomes vertical below the desktop breakpoint. Existing line
and accent variables are reused so the redesign works in both themes.

The localized `startup` strings in `zh.json` and `en.json` now describe the
same three-stage sequence. No new interaction or state is introduced; the
section remains a static explanation with a lightweight hover response on the
step node.

## Validation

- Run docs typecheck, lint, and production build.
- Inspect the localhost page at the desktop viewport and confirm the three
  nodes align with one continuous track and the previews remain legible.
- Check the mobile breakpoint and confirm the track becomes vertical while the
  cards remain one column.
- Verify reduced-motion styles remove the moving accent and node transition.
