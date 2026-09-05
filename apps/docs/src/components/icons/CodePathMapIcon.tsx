import { useId, type SVGProps } from "react";
import { CODE_PATH_LABELS, CODE_PATH_MAP, CODE_PATH_ROUTE, createCodePathDots, getCodePathPoint } from "./codePathMap";

export interface CodePathMapIconProps extends SVGProps<SVGSVGElement> {
  progress?: number;
}

const dots = createCodePathDots().map(({ x, y, opacity }) => (
  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" opacity={opacity} />
));

export const CodePathMapIcon = ({ progress = 1, ...props }: CodePathMapIconProps) => {
  const gradientId = useId();
  const revealId = `${gradientId}-reveal`;
  const point = getCodePathPoint(progress);
  const { width, height, start, end } = CODE_PATH_MAP;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={gradientId} x1={start.x} y1={start.y} x2={end.x} y2={end.y} gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--line-accent)" />
          <stop offset="1" stopColor="var(--line-success)" />
        </linearGradient>
        <mask id={revealId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <path
            d={CODE_PATH_ROUTE}
            stroke="white"
            strokeWidth="4"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - Math.min(1, Math.max(0, progress))}
          />
        </mask>
      </defs>
      <g fill="var(--line-muted)">{dots}</g>
      <g stroke="var(--line-border-strong)" strokeWidth="1">
        <path d="M 218 60 Q 325 -8 454 154" />
        <path d="M 454 154 Q 596 142 551 282" />
        <path d="M 454 154 Q 497 326 351 343" />
      </g>
      <path d={CODE_PATH_ROUTE} stroke="var(--line-border-strong)" strokeWidth="1.25" strokeDasharray="2 5" />
      <path
        d={CODE_PATH_ROUTE}
        stroke={`url(#${gradientId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="2 5"
        mask={`url(#${revealId})`}
      />
      {CODE_PATH_LABELS.map(({ x, y, kind, label }) => (
        <g key={label} className={`code-path-map__node code-path-map__node--${kind}`}>
          <circle cx={x} cy={y} r={kind === "context" ? 9 : 13} fill="var(--line-surface)" stroke="currentColor" strokeOpacity="0.35" />
          <circle cx={x} cy={y} r={kind === "context" ? 2.5 : 3.5} fill="currentColor" />
        </g>
      ))}
      <circle cx={point.x} cy={point.y} r="3.5" fill="var(--line-foreground)" opacity={progress > 0 && progress < 1 ? 1 : 0} />
    </svg>
  );
};

CodePathMapIcon.displayName = "CodePathMapIcon";
