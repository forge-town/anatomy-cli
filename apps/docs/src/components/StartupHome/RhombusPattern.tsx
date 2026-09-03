import { createPenroseTiling, pointsToSvg } from "./rhombus";

const rhombi = createPenroseTiling({ variant: "rhombus" });

export const RhombusPattern = () => (
  <svg
    aria-hidden="true"
    className="startup-grid-background__rhombus"
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
