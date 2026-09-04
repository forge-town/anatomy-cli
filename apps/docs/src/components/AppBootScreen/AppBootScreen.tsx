import { useEffect, useState } from "react";
import { applySavedLanguage } from "@/lib/i18n";
import { applyTheme, getSavedTheme } from "@/lib/theme";

type BootPhase = "entering" | "leaving" | "complete";

const MINIMUM_OPENING_MS = 640;
const MAXIMUM_FONT_WAIT_MS = 900;
const EXIT_MS = 360;

const wait = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

const waitForFonts = async () => {
  if (!("fonts" in document)) return;
  await Promise.race([document.fonts.ready.then(() => undefined), wait(MAXIMUM_FONT_WAIT_MS)]);
};

export const AppBootScreen = () => {
  const [phase, setPhase] = useState<BootPhase>("entering");

  useEffect(() => {
    let active = true;
    let exitTimer: number | undefined;
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealApp = () => {
      if (!active) return;

      document.documentElement.dataset.appReady = "true";
      setPhase("leaving");

      if (reduceMotion) {
        setPhase("complete");
        return;
      }

      exitTimer = window.setTimeout(() => {
        if (active) setPhase("complete");
      }, EXIT_MS);
    };

    const prepareApp = async () => {
      applyTheme(getSavedTheme());
      const language = await applySavedLanguage();
      document.documentElement.lang = language === "en" ? "en" : "zh-CN";

      await waitForFonts();
      await waitForPaint();

      if (!reduceMotion) {
        const remaining = Math.max(0, MINIMUM_OPENING_MS - (performance.now() - startedAt));
        if (remaining > 0) await wait(remaining);
      }

      revealApp();
    };

    void prepareApp().catch(revealApp);

    return () => {
      active = false;
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
    };
  }, []);

  if (phase === "complete") return null;

  return (
    <div
      aria-label="Anatomy"
      className="app-boot-screen"
      data-phase={phase}
      role="status"
    >
      <svg
        aria-hidden="true"
        className="app-boot-screen__triangle"
        viewBox="0 0 24 24"
      >
        <path d="M12 20L5.07 8H18.93Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
};

AppBootScreen.displayName = "AppBootScreen";
