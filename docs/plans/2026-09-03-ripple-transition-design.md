# Startup grid circular transition

## Intent

Use a simple circular reveal for Startup home pattern rotation. The new pattern
starts at the click point and expands outward until it replaces the previous
topology. The existing layer model remains authoritative: the outgoing pattern
stays below the incoming pattern, and the incoming pattern owns the reveal mask.

## Design

- Keep one outgoing layer and one incoming layer during a transition.
- Continue to reveal the incoming layer with a circular clip path whose origin
  is the click point (or the viewport center for automatic rotation).
- Do not render any additional ripple, distortion, glow, border, or background
  layer. The incoming layer alone covers the outgoing layer inside the circle.
- There is no crossfade or pause between patterns; `onAnimationComplete` still
  performs the immediate layer handoff.
- Respect `prefers-reduced-motion` by completing the circular reveal without an
  intermediate overlay.

## Implementation details

`StartupGridBackground.tsx` renders one static outgoing layer and one incoming
`motion.div`. The incoming layer animates its CSS `clip-path` from
`circle(0% at origin)` to `circle(120% at origin)`, so the incoming pattern is
always above and directly masks the outgoing pattern inside the circle.

`StartupHero.tsx` listens for clicks on the hero surface, ignores controls and
links, converts the click to hero-relative percentages, and sends a monotonic
request token to `StartupGridBackground`. The scheduler consumes each token
once, uses that origin for the clip path, and sets the next automatic deadline
to one full rotation interval after the click.

The existing 1.8s reveal duration and easing are retained. The result is a
single clean circular reveal with no intermediate ring or deformation layer.

## Validation

- Typecheck and lint the docs app.
- Build the docs app.
- Inspect the localhost page while a transition is active: confirm the DOM has
  one static layer and one incoming layer, with no additional ripple or ring.
- Click an empty point in the hero and confirm the circle starts at that point;
  click a package-manager button and confirm it changes only the control state.
- Confirm the next automatic rotation does not begin until a full interval
  after the manual click.
- Verify reduced-motion mode has no pulse overlay and no intermediate overlap.
