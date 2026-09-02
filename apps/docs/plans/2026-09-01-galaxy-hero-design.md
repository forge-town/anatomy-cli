# Galaxy hero integration design

## Intent

Bring the pasted Galaxy/Spline hero reference into the Anatomy CLI docs homepage without replacing the existing documentation IA. The hero keeps the current Anatomy message and routes, while adopting the reference's dark space field, orbit geometry, floating terminal window, status card, and compact navigation metadata.

## Decisions

- Use a dedicated `GalaxyHero` composition component rather than placing landing-page markup in `components/ui`.
- Keep actions on the existing Base UI button primitive and real TanStack Router links.
- Render the galaxy with CSS gradients, deterministic star positions, orbit keyframes, and a reduced-motion fallback. The referenced Spline package was tested but is incompatible with this project's React 19 runtime (`ReactCurrentDispatcher` error), so it is not part of the runtime dependency graph.
- Keep the hero dark in both theme modes so the visual reference remains coherent; the rest of the docs shell continues to follow the user's theme toggle.

## Validation

TypeScript and production builds must pass. The home route must render at the default viewport and at 945px and 390px widths without a runtime error or horizontal overflow. The primary CTA must navigate to `/docs/installation`.
