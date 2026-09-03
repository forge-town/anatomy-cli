# Kite-dart transition render state

## Intent

Prevent the kite-dart tiling from briefly showing every generated edge when a
transition mounts or hands off its incoming layer. The visible tiling keeps the
one-third sampling rule at every frame, including the first and last frame of
the circular reveal.

## Design

- Treat the visibility derived from the tile sampling pass as the initial
  render state, not as a post-mount hover update.
- Render sampled-out edges at opacity zero immediately. Keep shared edges that
  belong to a visible tile at full opacity.
- Let `updateKiteDartHover` replace the initial inline opacity only after the
  pointer field is available, so hidden edges can be revealed by the glow
  without changing the base tiling.
- Keep the incoming layer above the outgoing layer and avoid adding another
  transition layer or crossfade.

## Implementation details

`KiteDartPattern.tsx` now writes each edge's sampled visibility as an inline
opacity during render. `styles.css` repeats that invariant with a data-attribute
selector as a defensive default for any edge that mounts before effects run.
The existing hover updater removes the temporary inline declaration before it
sets `--kite-edge-opacity`, so pointer-driven glow behavior remains unchanged.

This removes the paint gap caused by waiting for `useEffect` to initialize a
new SVG layer. The same initial state is used when the transition completes and
React replaces the motion layer with the static layer.

## Validation

- Inspect the incoming kite-dart layer during a real click transition and
  confirm hidden edges compute to opacity `0` while visible edges remain `1`.
- Verify the settled kite-dart layer preserves the same sampled edge counts.
- Run docs typecheck, lint, production build, and `git diff --check`.
