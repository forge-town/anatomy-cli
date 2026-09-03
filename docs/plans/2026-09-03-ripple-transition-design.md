# Startup grid ripple transition

## Intent

Give the Startup home pattern rotation the same tactile pulse language as the
Kinetic Fabric reference: a fast impulse starts at the center, a visible energy
ring travels outward, and the ring replaces the previous topology as it passes.
The existing layer model remains authoritative: the outgoing pattern stays below
the incoming pattern, and the incoming pattern owns the reveal mask.

## Design

- Keep one outgoing layer and one incoming layer during a transition.
- Continue to reveal the incoming layer with a centered circular clip path.
- Add a transient pulse overlay above both pattern layers. It is a centered,
  circular energy band with two softer echo bands, driven by the same Motion
  timeline as the clip path.
- Fade the pulse only after it has crossed the stage. There is no crossfade or
  pause between patterns; `onAnimationComplete` still performs the immediate
  layer handoff.
- Keep the pulse pointer-free and respect `prefers-reduced-motion` by rendering
  the incoming pattern fully revealed without the transient overlay.

## Implementation details

`StartupGridBackground.tsx` will render a `motion.div` with a custom
`--ripple-progress` value from 0 to 120. The CSS radial gradient uses that value
to draw a narrow center ring plus two lower-alpha rings. The overlay is a
separate sibling of the incoming layer, so it cannot alter tile alignment or
introduce a second pattern layer.

The existing 1.8s reveal duration and easing are retained. The pulse uses the
same duration and easing, with opacity fading during the final 28% of travel.
This preserves the previously verified fast replacement while making the edge
read as a propagating pulse instead of a hard circular cutout.

## Validation

- Typecheck and lint the docs app.
- Build the docs app.
- Inspect the localhost page while a transition is active: confirm the DOM has
  one static layer, one incoming layer, and one pulse overlay; confirm the
  incoming clip path and ripple progress advance together.
- Verify reduced-motion mode has no pulse overlay and no intermediate overlap.
