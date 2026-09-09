import { add } from "./add";
import { type PenroseTile, type Point } from "./createPenroseTiling";

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
