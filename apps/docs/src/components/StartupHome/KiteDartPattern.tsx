import { createPenroseTiling, pointsToSvg } from "./rhombus";

const tiles = createPenroseTiling({ variant: "kite-dart", radius: 1200, levels: 5 });

type KiteDartPatternProps = {
  className?: string;
};

export const KiteDartPattern = ({ className }: KiteDartPatternProps) => (
  <svg
    aria-hidden="true"
    className={`startup-grid-background__kite-dart${className ? ` ${className}` : ""}`}
    viewBox="0 0 820 460"
    preserveAspectRatio="xMidYMid slice"
  >
    {tiles.map((tile) => (
      <polygon key={tile.id} data-kind={tile.kind} points={pointsToSvg(tile.points, 0.44)} />
    ))}
  </svg>
);

KiteDartPattern.displayName = "KiteDartPattern";
