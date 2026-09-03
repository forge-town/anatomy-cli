import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { RhombusPattern } from "./RhombusPattern";
import { KiteDartPattern } from "./KiteDartPattern";

type StartupGridBackgroundProps = {
  gridRef: { current: HTMLDivElement | null };
};

const ROTATION_INTERVAL_MS = 16_000;
const REVEAL_DURATION_MS = 1_800;
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
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (transition !== null) return;

    const holdTimer = window.setTimeout(() => {
      setTransition({ from: activeIndex, to: (activeIndex + 1) % patterns.length });
    }, HOLD_DURATION_MS);

    return () => {
      window.clearTimeout(holdTimer);
    };
  }, [activeIndex, transition]);

  const renderPattern = (index: number) => patterns[index]!.render("");

  const completeTransition = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    setTransition(null);
  };

  return (
    <div
      ref={gridRef}
      aria-hidden="true"
      className="startup-grid-background pointer-events-none absolute inset-0 z-0"
    >
      {transition ? (
        <>
          <motion.div
            key={`${patterns[transition.from]!.key}-outgoing`}
            className="startup-grid-background__layer startup-grid-background__layer--static"
            data-pattern={patterns[transition.from]!.key}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: [1, 1, 0], scale: [1, 1, 1.01] }}
            transition={{
              duration: shouldReduceMotion ? 0 : (REVEAL_DURATION_MS * 0.9) / 1000,
              times: [0, 0.8, 1],
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {renderPattern(transition.from)}
          </motion.div>
          <motion.div
            key={`${patterns[transition.to]!.key}-incoming`}
            className="startup-grid-background__layer startup-grid-background__layer--incoming"
            data-pattern={patterns[transition.to]!.key}
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(120% at 50% 50%)" }}
            transition={{
              duration: shouldReduceMotion ? 0 : REVEAL_DURATION_MS / 1000,
              ease: [0.65, 0, 0.35, 1],
            }}
            onAnimationComplete={() => completeTransition(transition.to)}
          >
            {renderPattern(transition.to)}
          </motion.div>
        </>
      ) : (
        <div
          className="startup-grid-background__layer startup-grid-background__layer--static"
          data-pattern={patterns[activeIndex]!.key}
        >
          {renderPattern(activeIndex)}
        </div>
      )}
    </div>
  );
};

StartupGridBackground.displayName = "StartupGridBackground";
