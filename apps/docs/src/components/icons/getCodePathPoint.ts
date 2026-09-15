import { CODE_PATH_MAP } from "./CODE_PATH_MAP";

export const getCodePathPoint = (progress: number) => {
  const t = Math.min(1, Math.max(0, progress));
  const { start, control, end } = CODE_PATH_MAP;
  return {
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
  };
};
