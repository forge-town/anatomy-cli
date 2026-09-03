export type Point = readonly [number, number];
export type PenroseVariant = "rhombus" | "kite-dart";
export type PenroseTile = {
  id: string;
  kind: "thin" | "thick" | "kite" | "dart";
  points: Point[];
};

type Triangle = { kind: 0 | 1; a: Point; b: Point; c: Point };

const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;
const INV_PHI_SQUARED = INV_PHI * INV_PHI;

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Point, factor: number): Point => [a[0] * factor, a[1] * factor];
const along = (a: Point, b: Point, factor: number): Point => add(a, scale(sub(b, a), factor));
const pointKey = (point: Point): string => `${point[0].toFixed(5)},${point[1].toFixed(5)}`;

const intersectsCenteredSquare = (triangle: Triangle, limit: number): boolean => {
  const points = [triangle.a, triangle.b, triangle.c];
  return !(
    points.every(([x]) => x < -limit) ||
    points.every(([, y]) => y < -limit) ||
    points.every(([x]) => x > limit) ||
    points.every(([, y]) => y > limit)
  );
};

const edgeKey = (kind: 0 | 1, a: Point, b: Point): string => {
  const first = pointKey(a);
  const second = pointKey(b);
  return first < second ? `${kind}|${first}|${second}` : `${kind}|${second}|${first}`;
};

const isMirrorAcrossEdge = (edgeA: Point, edgeB: Point, point: Point, other: Point) => {
  const dx = edgeB[0] - edgeA[0];
  const dy = edgeB[1] - edgeA[1];
  const lengthSquared = dx * dx + dy * dy;
  const relativeX = point[0] - edgeA[0];
  const relativeY = point[1] - edgeA[1];
  const projection = (relativeX * dx + relativeY * dy) / lengthSquared;
  const mirrored: Point = [
    edgeA[0] + 2 * projection * dx - relativeX,
    edgeA[1] + 2 * projection * dy - relativeY,
  ];
  return Math.hypot(mirrored[0] - other[0], mirrored[1] - other[1]) < Math.sqrt(lengthSquared) * 1e-5;
};

const subdivideRhombusTriangle = (triangle: Triangle): Triangle[] => {
  if (triangle.kind === 0) {
    const p = along(triangle.a, triangle.b, INV_PHI);
    return [
      { kind: 0, a: triangle.c, b: p, c: triangle.b },
      { kind: 1, a: p, b: triangle.c, c: triangle.a },
    ];
  }
  const q = along(triangle.b, triangle.a, INV_PHI);
  const r = along(triangle.b, triangle.c, INV_PHI);
  return [
    { kind: 1, a: r, b: triangle.c, c: triangle.a },
    { kind: 1, a: q, b: r, c: triangle.b },
    { kind: 0, a: r, b: q, c: triangle.a },
  ];
};

const subdivideKiteDartTriangle = (triangle: Triangle): Triangle[] => {
  if (triangle.kind === 0) {
    const p = along(triangle.a, triangle.b, INV_PHI_SQUARED);
    const q = along(triangle.a, triangle.c, INV_PHI);
    return [
      { kind: 1, a: p, b: q, c: triangle.a },
      { kind: 0, a: triangle.b, b: p, c: q },
      { kind: 0, a: triangle.b, b: triangle.c, c: q },
    ];
  }
  const g = along(triangle.c, triangle.b, INV_PHI);
  return [
    { kind: 0, a: triangle.c, b: g, c: triangle.a },
    { kind: 1, a: g, b: triangle.a, c: triangle.b },
  ];
};

const sunSeed = (radius: number): Triangle[] => {
  const seed: Triangle[] = [];
  for (let index = 0; index < 10; index += 1) {
    const firstAngle = ((2 * index - 1) * Math.PI) / 10;
    const secondAngle = ((2 * index + 1) * Math.PI) / 10;
    const b: Point = [radius * Math.cos(firstAngle), radius * Math.sin(firstAngle)];
    const c: Point = [radius * Math.cos(secondAngle), radius * Math.sin(secondAngle)];
    seed.push(
      index % 2 === 0
        ? { kind: 0, a: [0, 0], b: c, c: b }
        : { kind: 0, a: [0, 0], b, c },
    );
  }
  return seed;
};

const kiteSeed = (radius: number): Triangle[] => {
  const at = (degrees: number): Point => {
    const radians = (degrees * Math.PI) / 180;
    return [radius * Math.cos(radians), radius * Math.sin(radians)];
  };
  const seed: Triangle[] = [];
  for (let index = 0; index < 5; index += 1) {
    const axis = 72 * index;
    seed.push(
      { kind: 0, a: [0, 0], b: at(axis - 36), c: at(axis) },
      { kind: 0, a: [0, 0], b: at(axis + 36), c: at(axis) },
    );
  }
  return seed;
};

const subdivide = (
  seed: Triangle[],
  rule: (triangle: Triangle) => Triangle[],
  levels: number,
  keep?: (triangle: Triangle) => boolean,
): Triangle[] => {
  let current = seed;
  for (let level = 0; level < levels; level += 1) {
    current = current.flatMap(rule).filter((triangle) => !keep || keep(triangle));
  }
  return current;
};

const mergeHalfTiles = (
  triangles: Triangle[],
  glue: "base" | "axis",
  variant: PenroseVariant,
): PenroseTile[] => {
  const buckets = new Map<string, Array<{ triangle: Triangle; edge: [Point, Point]; other: Point }>>();
  for (const triangle of triangles) {
    const edge: [Point, Point] =
      glue === "base" ? [triangle.b, triangle.c] : [triangle.a, triangle.c];
    const other = glue === "base" ? triangle.a : triangle.b;
    const key = edgeKey(triangle.kind, edge[0], edge[1]);
    const list = buckets.get(key) ?? [];
    list.push({ triangle, edge, other });
    buckets.set(key, list);
  }

  const used = new Set<Triangle>();
  const tiles: PenroseTile[] = [];
  for (const list of buckets.values()) {
    for (let firstIndex = 0; firstIndex < list.length; firstIndex += 1) {
      const first = list[firstIndex];
      if (!first || used.has(first.triangle)) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < list.length; secondIndex += 1) {
        const second = list[secondIndex];
        if (!second || used.has(second.triangle)) continue;
        if (!isMirrorAcrossEdge(first.edge[0], first.edge[1], first.other, second.other)) continue;
        used.add(first.triangle);
        used.add(second.triangle);
        const kind = variant === "rhombus" ? (first.triangle.kind === 0 ? "thin" : "thick") : first.triangle.kind === 0 ? "kite" : "dart";
        tiles.push({
          id: `${variant}-${tiles.length}`,
          kind,
          points: [first.other, first.edge[0], second.other, first.edge[1]],
        });
        break;
      }
    }
  }
  return tiles;
};

export const createPenroseTiling = ({
  variant,
  radius = 1200,
  levels = 6,
}: {
  variant: PenroseVariant;
  radius?: number;
  levels?: number;
}): PenroseTile[] => {
  // The seed already spans the viewport. Deflation makes the interior tiles
  // smaller while the clipping pass keeps only the centred patch.
  const seedRadius = radius;
  const triangles = subdivide(
    variant === "rhombus" ? sunSeed(seedRadius) : kiteSeed(seedRadius),
    variant === "rhombus" ? subdivideRhombusTriangle : subdivideKiteDartTriangle,
    levels,
    (triangle) => intersectsCenteredSquare(triangle, radius + 80),
  );
  return mergeHalfTiles(triangles, variant === "rhombus" ? "base" : "axis", variant);
};

export const pointsToSvg = (points: Point[], scaleFactor = 1, offset: Point = [410, 230]): string =>
  points
    .map(([x, y]) => `${(x * scaleFactor + offset[0]).toFixed(2)},${(y * scaleFactor + offset[1]).toFixed(2)}`)
    .join(" ");

/** A deliberately simple 60°/120° edge-to-edge rhombus lattice for the hero. */
export const createRhombusTiling = ({
  columns = 28,
  rows = 20,
  size = 82,
}: {
  columns?: number;
  rows?: number;
  size?: number;
} = {}): PenroseTile[] => {
  const diagonal: Point = [size * 0.5, size * (Math.sqrt(3) / 2)];
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const origin: Point = [
        (column - (columns - 1) / 2) * size + (row - (rows - 1) / 2) * diagonal[0],
        (row - (rows - 1) / 2) * diagonal[1],
      ];
      const top = add(origin, [size, 0]);
      const right = add(top, diagonal);
      const left = add(origin, diagonal);
      return {
        id: `rhombus-${row}-${column}`,
        kind: "thin" as const,
        points: [origin, top, right, left],
      };
    }),
  ).flat();
};
