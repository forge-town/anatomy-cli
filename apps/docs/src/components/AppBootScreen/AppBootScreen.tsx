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
      <div aria-hidden="true" className="app-boot-screen__stage">
        <svg className="app-boot-screen__diagram" viewBox="0 0 280 104">
          <path className="app-boot-screen__track" d="M20 52H92L124 20H196L228 52H260" />
          <path className="app-boot-screen__track" d="M92 52L124 84H196L228 52" />
          <path className="app-boot-screen__trace" d="M20 52H92L124 20H196L228 52H260" />
          <circle className="app-boot-screen__node" cx="20" cy="52" r="3" />
          <circle className="app-boot-screen__node" cx="140" cy="20" r="3" />
          <circle className="app-boot-screen__node" cx="140" cy="84" r="3" />
          <circle className="app-boot-screen__node app-boot-screen__node--active" cx="260" cy="52" r="3" />
        </svg>
        <div className="app-boot-screen__wordmark">
          <span>ANATOMY</span>
          <span className="app-boot-screen__progress">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
};

AppBootScreen.displayName = "AppBootScreen";
