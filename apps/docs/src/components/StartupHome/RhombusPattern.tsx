import { createRhombusTiling, pointsToSvg } from "./rhombus";

const rhombi = createRhombusTiling();

type RhombusPatternProps = {
  className?: string;
};

export const RhombusPattern = ({ className }: RhombusPatternProps) => (
  <svg
    aria-hidden="true"
    className={`startup-grid-background__rhombus${className ? ` ${className}` : ""}`}
    viewBox="0 0 820 460"
    preserveAspectRatio="xMidYMid slice"
  >
    {rhombi.map((rhombus) => (
      <polygon
        key={rhombus.id}
        data-kind={rhombus.kind}
        points={pointsToSvg(rhombus.points, 0.44)}
      />
    ))}
  </svg>
);

RhombusPattern.displayName = "RhombusPattern";
