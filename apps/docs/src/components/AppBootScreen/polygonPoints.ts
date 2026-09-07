import { type Point } from "./TRIANGLE_VERTICES";

export const polygonPoints = (points: Point[]) => points.map(({ x, y }) => `${x},${y}`).join(" ");
