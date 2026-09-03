import { createRhombusTiling, pointsToSvg } from "./rhombus";

const rhombi = createRhombusTiling();

export const RhombusPattern = () => (
  <svg
    aria-hidden="true"
    className="startup-grid-background__rhombus"
    viewBox="0 0 820 460"
    preserveAspectRatio="xMidYMid slice"
  >
    {rhombi.map((rhombus) => (
      <polygon key={rhombus.id} points={pointsToSvg(rhombus.points)} />
    ))}
  </svg>
);
