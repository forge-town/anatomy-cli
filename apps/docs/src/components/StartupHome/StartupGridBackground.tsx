import { useEffect, useState, type ReactNode } from "react";

import { RhombusPattern } from "./RhombusPattern";
import { KiteDartPattern } from "./KiteDartPattern";

type StartupGridBackgroundProps = {
  gridRef: { current: HTMLDivElement | null };
};

const ROTATION_INTERVAL_MS = 16_000;
const REVEAL_DURATION_MS = 2_600;
const HOLD_DURATION_MS = ROTATION_INTERVAL_MS - REVEAL_DURATION_MS;

type PatternDefinition = {
  key: string;
  render: (className: string) => ReactNode;
};

const patterns: PatternDefinition[] = [
  {
    key: "triangle",
    render: (className) => <span className={`startup-grid-background__pattern startup-grid-background__pattern--triangle ${className}`} />,
  },
  {
    key: "hexagon",
    render: (className) => <span className={`startup-grid-background__pattern startup-grid-background__pattern--hexagon ${className}`} />,
  },
  {
    key: "voronoi",
    render: (className) => <span className={`startup-grid-background__pattern startup-grid-background__pattern--voronoi ${className}`} />,
  },
  {
    key: "pythagorean",
    render: (className) => <span className={`startup-grid-background__pattern startup-grid-background__pattern--pythagorean ${className}`} />,
  },
  { key: "rhombus", render: (className) => <RhombusPattern className={className} /> },
  { key: "kite-dart", render: (className) => <KiteDartPattern className={className} /> },
];

type Transition = {
  from: number;
  to: number;
};

export const StartupGridBackground = ({ gridRef }: StartupGridBackgroundProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);

  useEffect(() => {
    let holdTimer: number | undefined;
    let revealTimer: number | undefined;
    let cancelled = false;

    const scheduleNext = (currentIndex: number) => {
      holdTimer = window.setTimeout(() => {
        if (cancelled) return;

        const nextIndex = (currentIndex + 1) % patterns.length;
        setTransition({ from: currentIndex, to: nextIndex });

        revealTimer = window.setTimeout(() => {
          if (cancelled) return;

          setActiveIndex(nextIndex);
          setTransition(null);
          scheduleNext(nextIndex);
        }, REVEAL_DURATION_MS);
      }, HOLD_DURATION_MS);
    };

    scheduleNext(0);

    return () => {
      cancelled = true;
      if (holdTimer !== undefined) window.clearTimeout(holdTimer);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    };
  }, []);

  const renderPattern = (index: number, phase: "static" | "incoming") =>
    patterns[index]!.render(
      `startup-grid-background__layer startup-grid-background__layer--${phase}`,
    );

  return (
    <div
      ref={gridRef}
      aria-hidden="true"
      className="startup-grid-background pointer-events-none absolute inset-0 z-0"
    >
      {transition
        ? [
            <div key={`${patterns[transition.from]!.key}-outgoing`} className="startup-grid-background__slot">
              {renderPattern(transition.from, "static")}
            </div>,
            <div key={`${patterns[transition.to]!.key}-incoming`} className="startup-grid-background__slot">
              {renderPattern(transition.to, "incoming")}
            </div>,
          ]
        : renderPattern(activeIndex, "static")}
    </div>
  );
};

StartupGridBackground.displayName = "StartupGridBackground";
