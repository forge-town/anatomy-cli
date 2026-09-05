import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getTerminalDemoFrame, TERMINAL_DEMO_TIMING } from "./terminalDemo";

export const useTerminalDemo = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { amount: 0.15 });
  const reducedMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const isComplete = reducedMotion || elapsed >= TERMINAL_DEMO_TIMING.end;

  useEffect(() => {
    if (!isInView || isComplete) return;

    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (!document.hidden) {
        setElapsed((value) => Math.min(value + delta, TERMINAL_DEMO_TIMING.end));
      }
    }, 40);
    const resetClock = () => { previous = performance.now(); };
    document.addEventListener("visibilitychange", resetClock);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resetClock);
    };
  }, [isInView, isComplete]);

  return {
    ref,
    frame: getTerminalDemoFrame(reducedMotion ? TERMINAL_DEMO_TIMING.end : elapsed),
  };
};
