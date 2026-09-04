# Anatomy CI animated file tree

## Goal

Replace the static CI provider grid with a compact animated repository tree that explains continuous structure checking without showing workflow code.

## Direction

Adapt the horizontal SVG topology from Code Forge Lab's `AnimatedFileTreeExperiment`. Keep the curved parent-child connections and moving active path, but use Anatomy repository paths, existing `--line-*` tokens, and the current square, border-led visual language.

The tree cycles every 2.8 seconds through representative files under `src/components`, `src/routes`, and `src/lib`. Only the active ancestry receives the accent trace; completed nodes use the existing success color. The topology stays still while a small, unblurred status point breathes subtly. The animation starts only while the section is in view and becomes a readable static tree when reduced motion is requested.

## Component boundary

Create one focused `StartupCiFileTree` component beside `StartupCiSection`. The section owns copy and layout; the tree owns topology data, active-path state, motion, and its accessible image label.

## Responsive behavior

The SVG keeps a fixed view box and fills the CI section's right column without a decorative header or inner column padding. On narrow screens the CI columns stack without changing the tree topology. Definition rows in the earlier scan preview stay on one line and truncate their descriptive copy rather than wrapping.

## Validation

- Check light and dark themes.
- Check widths near 965 px and the mobile stack.
- Verify reduced motion produces no cycling timer.
- Run docs type checking, lint, and production build.
