import { getOpeningScale } from "./boot-geometry";

export const BOOT_MOTION = {
  turnMs: 500,
  holdFraction: 0.3,
  landingFraction: 0.86,
  raysMs: 560,
  raysHoldMs: 100,
  openingMs: 960,
} as const;

export const getTurnSettleMs = (elapsedMs: number) => {
  const position = elapsedMs % BOOT_MOTION.turnMs;
  return position > BOOT_MOTION.turnMs * BOOT_MOTION.holdFraction
    ? BOOT_MOTION.turnMs - position
    : 0;
};

export const waitForBoot = (duration: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, duration);
    signal.addEventListener("abort", cancel, { once: true });
  });

export const createBootMotion = (screen: HTMLElement, signal: AbortSignal) => {
  const animations = new Set<Animation>();
  const animate = (element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
    const animation = element.animate(frames, options);
    animations.add(animation);
    return animation;
  };
  const dispose = () => animations.forEach((animation) => animation.cancel());
  signal.addEventListener("abort", dispose, { once: true });

  const triangle = screen.querySelector(".app-boot-screen__triangle")!;
  const aperture = screen.querySelector(".app-boot-screen__aperture")!;
  const turn = animate(triangle, [
    { transform: "rotate(0deg)", offset: 0 },
    { transform: "rotate(0deg)", offset: BOOT_MOTION.holdFraction, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
    { transform: "rotate(118deg)", offset: BOOT_MOTION.landingFraction, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    { transform: "rotate(120deg)", offset: 1 },
  ], { duration: BOOT_MOTION.turnMs, iterations: Infinity });

  return {
    dispose,
    async reveal(onOpening: () => void) {
      const settlingMs = getTurnSettleMs(Number(turn.currentTime ?? 0));
      if (settlingMs > 0) await waitForBoot(settlingMs, signal);
      signal.throwIfAborted();
      turn.cancel();
      screen.dataset.phase = "rays";

      const rays = [...screen.querySelectorAll(".app-boot-screen__ray")].map((ray) =>
        animate(ray, [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
          duration: BOOT_MOTION.raysMs,
          easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          fill: "forwards",
        }),
      );
      await Promise.all(rays.map((ray) => ray.finished));
      await waitForBoot(BOOT_MOTION.raysHoldMs, signal);
      signal.throwIfAborted();

      onOpening();
      screen.dataset.phase = "opening";
      const { width, height } = screen.getBoundingClientRect();
      await animate(aperture, [
        { transform: "scale(1)" },
        { transform: `scale(${getOpeningScale(width, height)})` },
      ], {
        duration: BOOT_MOTION.openingMs,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards",
      }).finished;
    },
  };
};
