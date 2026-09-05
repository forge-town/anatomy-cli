export type Point = { x: number; y: number };

export const TRIANGLE_RADIUS = 16;
export const TRIANGLE_INRADIUS = TRIANGLE_RADIUS / 2;
const HALF_SIDE = (Math.sqrt(3) * TRIANGLE_RADIUS) / 2;
const OVERSCAN = 48;

export const TRIANGLE_VERTICES: Point[] = [
  { x: -HALF_SIDE, y: -TRIANGLE_INRADIUS },
  { x: HALF_SIDE, y: -TRIANGLE_INRADIUS },
  { x: 0, y: TRIANGLE_RADIUS },
];

export const polygonPoints = (points: Point[]) => points.map(({ x, y }) => `${x},${y}`).join(" ");

export const getOpeningScale = (width: number, height: number) =>
  (Math.hypot(width, height) / 2 + OVERSCAN) / TRIANGLE_INRADIUS;

export const createBootGeometry = (width: number, height: number) => {
  const [a, b, c] = TRIANGLE_VERTICES as [Point, Point, Point];
  const extent = Math.max(width, height) + OVERSCAN;
  const top = { x: a.x - (extent + a.y) / Math.sqrt(3), y: -extent };
  const bottom = { x: c.x - (extent - c.y) / Math.sqrt(3), y: extent };

  // Each ray continues one side beyond its endpoint. Together with the three
  // polygons this partitions the viewport, leaving only the central triangle.
  const panels = [
    [a, b, { x: extent, y: b.y }, { x: extent, y: -extent }, top],
    [b, c, bottom, { x: extent, y: extent }, { x: extent, y: b.y }],
    [c, a, top, { x: -extent, y: -extent }, { x: -extent, y: extent }, bottom],
  ];

  const rays = TRIANGLE_VERTICES.map((start, index) => {
    const previous = TRIANGLE_VERTICES[(index + 2) % 3]!;
    const dx = start.x - previous.x;
    const dy = start.y - previous.y;
    const tx = dx === 0 ? Infinity : (Math.sign(dx) * (width / 2 + OVERSCAN) - start.x) / dx;
    const ty = dy === 0 ? Infinity : (Math.sign(dy) * (height / 2 + OVERSCAN) - start.y) / dy;
    const distance = Math.min(tx, ty);

    return { start, end: { x: start.x + dx * distance, y: start.y + dy * distance } };
  });

  return { panels, rays };
};
