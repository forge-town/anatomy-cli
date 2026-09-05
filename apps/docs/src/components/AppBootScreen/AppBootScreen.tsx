import { useEffect, useRef, useState } from "react";
import { applySavedLanguage } from "@/lib/i18n";
import { applyTheme, getSavedTheme } from "@/lib/theme";
import { createBootGeometry, polygonPoints, TRIANGLE_VERTICES } from "./boot-geometry";
import { createBootMotion, waitForBoot } from "./boot-motion";

const MINIMUM_OPENING_MS = 640;
const MAXIMUM_FONT_WAIT_MS = 900;

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

export const AppBootScreen = () => {
  const screenRef = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);
  const [geometry, setGeometry] = useState(() => createBootGeometry(1920, 1080));

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const controller = new AbortController();
    const { signal } = controller;
    const startedAt = performance.now();
    const root = document.documentElement;
    delete root.dataset.appReady;
    delete root.dataset.appRevealing;
    const content = document.querySelector<HTMLElement>(".app-boot-content");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = !preference.matches && typeof screen.animate === "function"
      ? createBootMotion(screen, signal)
      : undefined;
    let prepared = false;

    if (content) content.inert = true;

    const resize = () => setGeometry(createBootGeometry(window.innerWidth, window.innerHeight));
    resize();
    window.addEventListener("resize", resize);

    const finish = () => {
      if (signal.aborted) return;
      root.dataset.appReady = "true";
      delete root.dataset.appRevealing;
      if (content) content.inert = false;
      screen.dataset.phase = "complete";
      setComplete(true);
      motion?.dispose();
    };

    const onMotionPreferenceChange = () => {
      if (preference.matches) {
        motion?.dispose();
        if (prepared) finish();
      }
    };
    preference.addEventListener("change", onMotionPreferenceChange);

    const prepareApp = async () => {
      applyTheme(getSavedTheme());
      const language = await applySavedLanguage();
      if (signal.aborted) return;
      root.lang = language === "en" ? "en" : "zh-CN";

      if ("fonts" in document) {
        await Promise.race([document.fonts.ready, waitForBoot(MAXIMUM_FONT_WAIT_MS, signal)]);
      }
      await waitForPaint();
      if (signal.aborted) return;
      prepared = true;

      if (motion && !preference.matches) {
        const remaining = Math.max(0, MINIMUM_OPENING_MS - (performance.now() - startedAt));
        if (remaining > 0) await waitForBoot(remaining, signal);
        if (preference.matches) return finish();
        await motion.reveal(() => { root.dataset.appRevealing = "true"; });
      }
      finish();
    };

    void prepareApp().catch(finish);

    return () => {
      controller.abort();
      window.removeEventListener("resize", resize);
      preference.removeEventListener("change", onMotionPreferenceChange);
      if (content) content.inert = false;
      root.dataset.appReady = "true";
      delete root.dataset.appRevealing;
    };
  }, [complete]);

  if (complete) return null;

  return (
    <div
      ref={screenRef}
      aria-label="Anatomy"
      className="app-boot-screen"
      data-phase="loading"
      role="status"
    >
      <svg
        aria-hidden="true"
        className="app-boot-screen__geometry"
        viewBox="-20 -20 40 40"
      >
        <g className="app-boot-screen__aperture">
          <g className="app-boot-screen__panels">
            {geometry.panels.map((points, index) => (
              <polygon key={index} points={polygonPoints(points)} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {geometry.rays.map(({ start, end }, index) => (
            <line
              key={index}
              className="app-boot-screen__ray"
              x1={start.x} y1={start.y} x2={end.x} y2={end.y}
              pathLength="1" vectorEffect="non-scaling-stroke"
            />
          ))}
          <polygon
            className="app-boot-screen__triangle"
            points={polygonPoints(TRIANGLE_VERTICES)}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </div>
  );
};

AppBootScreen.displayName = "AppBootScreen";
