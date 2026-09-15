import { TRIANGLE_INRADIUS } from "./TRIANGLE_INRADIUS";
import { TRIANGLE_RADIUS } from "./TRIANGLE_RADIUS";

export type Point = { x: number; y: number };

const HALF_SIDE = (Math.sqrt(3) * TRIANGLE_RADIUS) / 2;

export const TRIANGLE_VERTICES: Point[] = [
  { x: -HALF_SIDE, y: -TRIANGLE_INRADIUS },
  { x: HALF_SIDE, y: -TRIANGLE_INRADIUS },
  { x: 0, y: TRIANGLE_RADIUS },
];
