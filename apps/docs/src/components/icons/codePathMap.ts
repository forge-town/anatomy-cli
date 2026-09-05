export const CODE_PATH_MAP = {
  width: 640,
  height: 400,
  start: { x: 112, y: 286 },
  control: { x: 225, y: -30 },
  end: { x: 454, y: 154 },
} as const;

export const CODE_PATH_ROUTE = `M ${CODE_PATH_MAP.start.x} ${CODE_PATH_MAP.start.y} Q ${CODE_PATH_MAP.control.x} ${CODE_PATH_MAP.control.y} ${CODE_PATH_MAP.end.x} ${CODE_PATH_MAP.end.y}`;

export const CODE_PATH_LABELS = [
  { label: "src/legacy/", x: 112, y: 286, kind: "source" },
  { label: "src/components/ui/", x: 454, y: 154, kind: "destination" },
  { label: "routes/", x: 218, y: 60, kind: "context" },
  { label: "lib/", x: 551, y: 282, kind: "context" },
  { label: "tests/", x: 351, y: 343, kind: "context" },
] as const;

const islands = [
  { x: 110, y: 283, rx: 76, ry: 53 },
  { x: 215, y: 64, rx: 82, ry: 38 },
  { x: 452, y: 156, rx: 118, ry: 76 },
  { x: 552, y: 280, rx: 59, ry: 43 },
  { x: 350, y: 345, rx: 90, ry: 37 },
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

export const getCodePathPoint = (progress: number) => {
  const t = Math.min(1, Math.max(0, progress));
  const { start, control, end } = CODE_PATH_MAP;
  return {
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
  };
};
