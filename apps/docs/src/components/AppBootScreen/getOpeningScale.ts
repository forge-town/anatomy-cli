import { OVERSCAN } from "./OVERSCAN";
import { TRIANGLE_INRADIUS } from "./TRIANGLE_INRADIUS";

export const getOpeningScale = (width: number, height: number) =>
  (Math.hypot(width, height) / 2 + OVERSCAN) / TRIANGLE_INRADIUS;
