const DEFAULT_HOVER_RADIUS_PX = 150;

export const updateKiteDartHover = (
  grid: HTMLElement,
  clientX: number | null,
  clientY: number | null,
) => {
  if (clientX === null || clientY === null) return;

  const hoverRadius =
    Number.parseFloat(getComputedStyle(grid).getPropertyValue("--grid-hover-radius")) ||
    DEFAULT_HOVER_RADIUS_PX;

  grid.querySelectorAll<SVGSVGElement>(".startup-grid-background__kite-dart").forEach((svg) => {
    const transform = svg.getScreenCTM();
    if (!transform) return;

    const inverse = transform.inverse();
    const pointer = new DOMPoint(clientX, clientY).matrixTransform(inverse);
    const scaleX = Math.hypot(transform.a, transform.b) || 1;
    const scaleY = Math.hypot(transform.c, transform.d) || 1;
    const gradient = svg.querySelector<SVGRadialGradientElement>("[data-kite-glow-gradient]");
    if (gradient) {
      gradient.setAttribute("cx", pointer.x.toFixed(3));
      gradient.setAttribute("cy", pointer.y.toFixed(3));
      gradient.setAttribute("r", (hoverRadius / Math.sqrt(scaleX * scaleY)).toFixed(3));
    }
  });
};
