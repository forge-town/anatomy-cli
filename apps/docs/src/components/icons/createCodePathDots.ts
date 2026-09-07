import { CODE_PATH_MAP } from "./CODE_PATH_MAP";

const islands = [
  { x: 110, y: 396, rx: 76, ry: 74 },
  { x: 215, y: 90, rx: 82, ry: 53 },
  { x: 452, y: 218, rx: 118, ry: 106 },
  { x: 552, y: 392, rx: 59, ry: 60 },
  { x: 350, y: 483, rx: 90, ry: 52 },
];

export const createCodePathDots = () => {
  const dots: { x: number; y: number; opacity: number }[] = [];
  for (let y = 24; y < CODE_PATH_MAP.height - 12; y += 8) {
    for (let x = 20; x < CODE_PATH_MAP.width - 12; x += 8) {
      const distance = Math.min(...islands.map((island) =>
        ((x - island.x) / island.rx) ** 2 + ((y - island.y) / island.ry) ** 2));
      const edge = 0.93 + Math.sin(x * 0.055 + y * 0.023) * 0.12;
      if (distance < edge) {
        dots.push({ x, y, opacity: Math.max(0.16, 0.5 - distance * 0.3) });
      }
    }
  }
  return dots;
};
