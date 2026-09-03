export type Point = readonly [number, number];

export type RhombusTile = {
  id: string;
  points: [Point, Point, Point, Point];
};

const COS_60 = 0.5;
const SIN_60 = Math.sqrt(3) / 2;

const add = ([ax, ay]: Point, [bx, by]: Point): Point => [ax + bx, ay + by];

/** Generate edge-to-edge rhombi with 60° and 120° interior angles. */
export const createRhombusTiling = ({
  columns = 14,
  rows = 8,
  size = 42,
}: {
  columns?: number;
  rows?: number;
  size?: number;
} = {}): RhombusTile[] => {
  const horizontal: Point = [size, 0];
  const diagonal: Point = [size * COS_60, size * SIN_60];

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const origin: Point = [
        column * horizontal[0] + row * diagonal[0],
        row * diagonal[1],
      ];
      const top = add(origin, horizontal);
      const right = add(top, diagonal);
      const left = add(origin, diagonal);
      const points: [Point, Point, Point, Point] = [origin, top, right, left];
      return {
        id: `rhombus-${row}-${column}`,
        points,
      };
    }),
  ).flat();
};

export const pointsToSvg = (points: Point[]): string =>
  points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
