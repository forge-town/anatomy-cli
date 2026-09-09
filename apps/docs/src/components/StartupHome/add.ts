import { type Point } from "./createPenroseTiling";

export const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
