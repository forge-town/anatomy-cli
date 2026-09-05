import { createPenroseTiling, type Point } from "./rhombus";
import { useEffect, useId, useRef } from "react";

const tiles = createPenroseTiling({ variant: "kite-dart", radius: 1200, levels: 5 });
const SVG_SCALE = 0.44;
const SVG_OFFSET_X = 410;
const SVG_OFFSET_Y = 230;

const DEFAULT_HOVER_RADIUS_PX = 150;

type KiteDartPatternProps = {
  className?: string;
};

type Edge = {
  start: Point;
  end: Point;
  visible: boolean;
};

const pointKey = ([x, y]: Point) => `${x.toFixed(5)},${y.toFixed(5)}`;

const edgeKey = (start: Point, end: Point) => {
  const first = pointKey(start);
  const second = pointKey(end);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
};

const createEdges = () => {
  const edgeMap = new Map<string, Edge>();

  tiles.forEach((tile, tileIndex) => {
    const visible = tileIndex % 3 === 0;
    for (let index = 0; index < tile.points.length; index += 1) {
      const start = tile.points[index]!;
      const end = tile.points[(index + 1) % tile.points.length]!;
      const key = edgeKey(start, end);
      const existing = edgeMap.get(key);
      if (existing) {
        existing.visible ||= visible;
      } else {
        edgeMap.set(key, { start, end, visible });
      }
    }
  });

  return [...edgeMap.values()];
};

const pointToSvg = ([x, y]: Point) => ({
  x: (x * SVG_SCALE + SVG_OFFSET_X).toFixed(2),
  y: (y * SVG_SCALE + SVG_OFFSET_Y).toFixed(2),
});

const edgeToPathSegment = (edge: Edge) => {
  const start = pointToSvg(edge.start);
  const end = pointToSvg(edge.end);
  return `M${start.x} ${start.y}L${end.x} ${end.y}`;
};

const edges = createEdges();
const basePath = edges
  .filter((edge) => edge.visible)
  .map(edgeToPathSegment)
  .join(" ");
const glowPath = edges.map(edgeToPathSegment).join(" ");

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

export const KiteDartPattern = ({ className }: KiteDartPatternProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = `kite-dart-glow-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    const svg = svgRef.current;
    const grid = svg?.closest<HTMLElement>(".startup-grid-background");
    if (!svg || !grid) return;

    const styles = getComputedStyle(grid);
    const clientX = Number.parseFloat(styles.getPropertyValue("--grid-pointer-client-x"));
    const clientY = Number.parseFloat(styles.getPropertyValue("--grid-pointer-client-y"));
    const active = styles.getPropertyValue("--grid-pointer-active").trim() === "1";
    if (active && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      updateKiteDartHover(grid, clientX, clientY);
    } else {
      updateKiteDartHover(grid, null, null);
    }
  }, [gradientId]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={`startup-grid-background__kite-dart${className ? ` ${className}` : ""}`}
      viewBox="0 0 820 460"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient
          id={gradientId}
          data-kite-glow-gradient="true"
          cx="410"
          cy="230"
          r="118"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgb(192 132 252)" stopOpacity="0.92" />
          <stop offset="46%" stopColor="rgb(251 113 133)" stopOpacity="0.72" />
          <stop offset="78%" stopColor="rgb(240 112 93)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="rgb(240 112 93)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="startup-grid-background__kite-dart-edge" d={basePath} />
      <path
        className="startup-grid-background__kite-dart-glow"
        d={glowPath}
        stroke={`url(#${gradientId})`}
      />
    </svg>
  );
};

KiteDartPattern.displayName = "KiteDartPattern";
