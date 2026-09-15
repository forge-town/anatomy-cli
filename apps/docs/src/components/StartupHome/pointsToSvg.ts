import { type Point } from "./createPenroseTiling";

export const pointsToSvg = (points: Point[], scaleFactor = 1, offset: Point = [410, 230]): string =>
  points
    .map(([x, y]) => `${(x * scaleFactor + offset[0]).toFixed(2)},${(y * scaleFactor + offset[1]).toFixed(2)}`)
    .join(" ");
