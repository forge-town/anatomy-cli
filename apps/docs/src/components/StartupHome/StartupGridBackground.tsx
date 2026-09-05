import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { KiteDartPattern } from "./KiteDartPattern";

type StartupGridBackgroundProps = {
  gridRef: { current: HTMLDivElement | null };
  transitionRequest?: StartupGridTransitionRequest | null;
};

export type StartupGridTransitionOrigin = {
  x: number;
  y: number;
};

export type StartupGridTransitionRequest = {
  origin: StartupGridTransitionOrigin;
  token: number;
};

const ROTATION_INTERVAL_MS = 16_000;
const REVEAL_DURATION_MS = 1_800;
const HOLD_DURATION_MS = ROTATION_INTERVAL_MS - REVEAL_DURATION_MS;
const DEFAULT_TRANSITION_ORIGIN: StartupGridTransitionOrigin = { x: 50, y: 50 };

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
  { key: "kite-dart", render: (className) => <KiteDartPattern className={className} /> },
];

export const updateGridPatternHover = (
  grid: HTMLElement,
  clientX: number | null,
  clientY: number | null,
) => {
  if (clientX === null || clientY === null) return;

  grid.querySelectorAll<HTMLElement>(".startup-grid-background__pattern").forEach((pattern) => {
    const rect = pattern.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    pattern.style.setProperty("--grid-pattern-pointer-x", `${x.toFixed(3)}%`);
    pattern.style.setProperty("--grid-pattern-pointer-y", `${y.toFixed(3)}%`);
  });
};

type Transition = {
  from: number;
  to: number;
};

export const StartupGridBackground = ({
  gridRef,
  transitionRequest = null,
}: StartupGridBackgroundProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [transitionOrigin, setTransitionOrigin] = useState(DEFAULT_TRANSITION_ORIGIN);
  const [nextTransitionAt, setNextTransitionAt] = useState(
    () => Date.now() + HOLD_DURATION_MS,
  );
  const shouldReduceMotion = useReducedMotion();
  const handledRequestTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (transition !== null) return;

    const delay = Math.max(0, nextTransitionAt - Date.now());
    const holdTimer = window.setTimeout(() => {
      const now = Date.now();
      setNextTransitionAt(now + ROTATION_INTERVAL_MS);
      setTransitionOrigin(DEFAULT_TRANSITION_ORIGIN);
      setTransition({ from: activeIndex, to: (activeIndex + 1) % patterns.length });
    }, delay);

    return () => {
      window.clearTimeout(holdTimer);
    };
  }, [activeIndex, nextTransitionAt, transition]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const styles = getComputedStyle(grid);
    const clientX = Number.parseFloat(styles.getPropertyValue("--grid-pointer-client-x"));
    const clientY = Number.parseFloat(styles.getPropertyValue("--grid-pointer-client-y"));
    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      updateGridPatternHover(grid, clientX, clientY);
    }
  }, [activeIndex, gridRef, transition]);

  useEffect(() => {
    if (
      transitionRequest === null ||
      handledRequestTokenRef.current === transitionRequest.token
    ) {
      return;
    }

    handledRequestTokenRef.current = transitionRequest.token;
    if (transition !== null) return;

    const now = Date.now();
    setNextTransitionAt(now + ROTATION_INTERVAL_MS);
    setTransitionOrigin(transitionRequest.origin);
    setTransition({ from: activeIndex, to: (activeIndex + 1) % patterns.length });
  }, [activeIndex, transition, transitionRequest]);

  const renderPattern = (index: number) => patterns[index]!.render("");

  const completeTransition = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    setTransition(null);
  };

  const transitionOriginPosition = `${transitionOrigin.x}% ${transitionOrigin.y}%`;

  return (
    <div
      ref={gridRef}
      aria-hidden="true"
      className="startup-grid-background pointer-events-none absolute inset-0 z-0"
    >
      {transition ? (
        <>
          <div
            key={`${patterns[transition.from]!.key}-outgoing`}
            className="startup-grid-background__layer startup-grid-background__layer--static"
            data-pattern={patterns[transition.from]!.key}
          >
            {renderPattern(transition.from)}
          </div>
          <motion.div
            key={`${patterns[transition.to]!.key}-incoming`}
            className="startup-grid-background__layer startup-grid-background__layer--incoming"
            data-pattern={patterns[transition.to]!.key}
            initial={{ clipPath: `circle(0% at ${transitionOriginPosition})` }}
            animate={{ clipPath: `circle(120% at ${transitionOriginPosition})` }}
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
