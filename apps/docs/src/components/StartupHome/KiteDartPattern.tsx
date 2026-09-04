import { createPenroseTiling, type Point } from "./rhombus";
import { useEffect, useId, useRef } from "react";

const tiles = createPenroseTiling({ variant: "kite-dart", radius: 1200, levels: 5 });
const SVG_SCALE = 0.44;
const SVG_OFFSET_X = 410;
const SVG_OFFSET_Y = 230;

const DEFAULT_HOVER_RADIUS_PX = 150;
const KITE_DART_HOVER_FADE_PX = 48;

type KiteDartPatternProps = {
  className?: string;
};

type Edge = {
  key: string;
  start: Point;
  end: Point;
  visible: boolean;
  hiddenTileCenters: Array<{ x: number; y: number }>;
};

const pointKey = ([x, y]: Point) => `${x.toFixed(5)},${y.toFixed(5)}`;

const edgeKey = (start: Point, end: Point) => {
  const first = pointKey(start);
  const second = pointKey(end);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
};

const tileCenter = (points: readonly (readonly [number, number])[]) => {
  const center = points.reduce(
    ([x, y], [pointX, pointY]) => [x + pointX, y + pointY],
    [0, 0],
  );
  return {
    x: (center[0] / points.length) * SVG_SCALE + SVG_OFFSET_X,
    y: (center[1] / points.length) * SVG_SCALE + SVG_OFFSET_Y,
  };
};

const edges = tiles.reduce<Edge[]>((result, tile, tileIndex) => {
  const hidden = tileIndex % 3 !== 0;
  const center = tileCenter(tile.points);
  for (let index = 0; index < tile.points.length; index += 1) {
    const start = tile.points[index]!;
    const end = tile.points[(index + 1) % tile.points.length]!;
    const key = edgeKey(start, end);
    const existing = result.find((edge) => edge.key === key);
    if (existing) {
      existing.visible ||= !hidden;
      if (hidden) existing.hiddenTileCenters.push(center);
      continue;
    }
    result.push({
      key,
      start,
      end,
      visible: !hidden,
      hiddenTileCenters: hidden ? [center] : [],
    });
  }
  return result;
}, []);

const pointToSvg = ([x, y]: Point) => ({
  x: (x * SVG_SCALE + SVG_OFFSET_X).toFixed(2),
  y: (y * SVG_SCALE + SVG_OFFSET_Y).toFixed(2),
});

const renderEdge = (edge: Edge) => {
  const start = pointToSvg(edge.start);
  const end = pointToSvg(edge.end);
  return (
    <line
      key={edge.key}
      className="startup-grid-background__kite-dart-edge"
      data-kite-edge="true"
      data-kite-edge-visible={edge.visible ? "true" : "false"}
      data-kite-hidden-centers={edge.hiddenTileCenters
        .map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`)
        .join("|")}
      style={{
        opacity: edge.visible ? 1 : 0,
        visibility: edge.visible ? "visible" : "hidden",
      }}
      x1={start.x}
      x2={end.x}
      y1={start.y}
      y2={end.y}
    />
  );
};

export const updateKiteDartHover = (
  grid: HTMLElement,
  clientX: number | null,
  clientY: number | null,
) => {
  const edgesInGrid = grid.querySelectorAll<SVGLineElement>("[data-kite-edge]");
  if (clientX === null || clientY === null) {
    edgesInGrid.forEach((edge) => {
      const visible = edge.dataset.kiteEdgeVisible === "true";
      edge.removeAttribute("data-kite-glow");
      edge.style.removeProperty("stroke");
      edge.style.removeProperty("opacity");
      edge.style.removeProperty("--kite-edge-stroke");
      edge.style.setProperty("--kite-edge-opacity", visible ? "1" : "0");
      edge.style.setProperty("visibility", visible ? "visible" : "hidden");
    });
    return;
  }

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
    svg.querySelectorAll<SVGLineElement>("[data-kite-edge]").forEach((edge) => {
      let glowAmount = 0;
      const centers = edge.dataset.kiteHiddenCenters?.split("|") ?? [];
      centers.forEach((entry) => {
        const [centerX, centerY] = entry.split(",");
        if (!centerX || !centerY) return;
        const distance = Math.hypot(
          (Number(centerX) - pointer.x) * scaleX,
          (Number(centerY) - pointer.y) * scaleY,
        );
        const opacity = Math.max(
          0,
          Math.min(1, (hoverRadius - distance) / KITE_DART_HOVER_FADE_PX),
        );
        glowAmount = Math.max(glowAmount, opacity);
      });
      const visible = edge.dataset.kiteEdgeVisible === "true";
      edge.removeAttribute("data-kite-glow");
      edge.style.removeProperty("stroke");
      edge.style.removeProperty("opacity");
      if (gradient && glowAmount > 0) {
        edge.style.setProperty("--kite-edge-stroke", `url(#${gradient.id})`);
      } else {
        edge.style.removeProperty("--kite-edge-stroke");
      }
      edge.style.setProperty("visibility", visible || glowAmount > 0 ? "visible" : "hidden");
      edge.style.setProperty(
        "--kite-edge-opacity",
        visible ? "1" : glowAmount.toFixed(3),
      );
    });
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
          <stop offset="100%" stopColor="rgb(35 35 31)" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <g className="startup-grid-background__kite-dart-edges">
        {edges.map((edge) => renderEdge(edge))}
      </g>
    </svg>
  );
};

KiteDartPattern.displayName = "KiteDartPattern";
