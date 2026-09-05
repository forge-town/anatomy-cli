import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import {
  StartupGridBackground,
  updateGridPatternHover,
  type StartupGridTransitionRequest,
} from "./StartupGridBackground";
import { updateKiteDartHover } from "./KiteDartPattern";

type PackageManager = "npm" | "pnpm" | "bun";
type HeroTitlePhase = "present" | "exit" | "enter-start";

const heroTitleKeys = [
  "startup.heroTitleLine1",
  "startup.heroTitleLine1Alt",
  "startup.heroTitleLine1Alt2",
] as const;
const HERO_GLYPH_STAGGER_MAX = 72;
const HERO_GLYPH_DURATION = 420;
const HERO_REFERENCE_GLYPH_COUNT = 4;
const HERO_TRANSITION_WINDOW =
  HERO_GLYPH_DURATION + (HERO_REFERENCE_GLYPH_COUNT - 1) * HERO_GLYPH_STAGGER_MAX;
const HERO_ROTATION_INTERVAL = 5000;
const installCommands: Record<PackageManager, string> = {
  npm: "npx anatomy-cli",
  pnpm: "pnpm dlx anatomy-cli",
  bun: "bunx anatomy-cli",
};

const countTitleGlyphs = (title: string) => Array.from(title).filter((character) => !/\s/.test(character)).length;

const getHeroGlyphStagger = (glyphCount: number) =>
  glyphCount <= 1
    ? 0
    : Math.min(
        HERO_GLYPH_STAGGER_MAX,
        (HERO_TRANSITION_WINDOW - HERO_GLYPH_DURATION) / (glyphCount - 1),
      );

const HeroTitleGlyphs = ({
  title,
  titleIndex,
  phase,
  glyphStagger,
}: {
  title: string;
  titleIndex: number;
  phase: HeroTitlePhase;
  glyphStagger: number;
}) => {
  let glyphIndex = 0;

  return title.split(/(\s+)/).map((part, partIndex) => {
    if (/^\s+$/.test(part)) {
      return (
        <span className="hero-cover__space" key={`${titleIndex}-space-${partIndex}`}>
          {part}
        </span>
      );
    }

    return (
      <span className="hero-cover__word" key={`${titleIndex}-word-${partIndex}`}>
        {Array.from(part).map((character) => {
          const currentGlyphIndex = glyphIndex;
          glyphIndex += 1;
          return (
            <span
              className={`hero-cover__glyph hero-cover__glyph--${phase}`}
              key={`${titleIndex}-${currentGlyphIndex}`}
              style={{ transitionDelay: `${currentGlyphIndex * glyphStagger}ms` }}
            >
              {character}
            </span>
          );
        })}
      </span>
    );
  });
};

export const StartupHero = () => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroTitleTextRef = useRef<HTMLSpanElement>(null);
  const clickTokenRef = useRef(0);
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);
  const [heroTitleIndex, setHeroTitleIndex] = useState(0);
  const [heroTitlePhase, setHeroTitlePhase] = useState<HeroTitlePhase>("present");
  const [heroTitleWidth, setHeroTitleWidth] = useState<number | null>(null);
  const [transitionRequest, setTransitionRequest] = useState<StartupGridTransitionRequest | null>(null);
  const command = installCommands[packageManager];
  const heroTitle = t(heroTitleKeys[heroTitleIndex] ?? heroTitleKeys[0]);
  const heroTitleGlyphCount = countTitleGlyphs(heroTitle);
  const heroGlyphStagger = getHeroGlyphStagger(heroTitleGlyphCount);
  const heroExitDuration =
    HERO_GLYPH_DURATION + Math.max(0, heroTitleGlyphCount - 1) * heroGlyphStagger;

  useEffect(() => {
    const hero = heroRef.current;
    const grid = gridRef.current;
    if (!hero || !grid) return;

    let frame = 0;
    let latestEvent: PointerEvent | null = null;
    const updatePointerField = () => {
      frame = 0;
      if (!latestEvent) return;
      const rect = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, latestEvent.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, latestEvent.clientY - rect.top));
      grid.style.setProperty("--grid-pointer-x", `${((x / rect.width) * 100).toFixed(2)}%`);
      grid.style.setProperty("--grid-pointer-y", `${((y / rect.height) * 100).toFixed(2)}%`);
      grid.style.setProperty("--grid-pointer-client-x", `${latestEvent.clientX}px`);
      grid.style.setProperty("--grid-pointer-client-y", `${latestEvent.clientY}px`);
      updateGridPatternHover(grid, latestEvent.clientX, latestEvent.clientY);
      updateKiteDartHover(grid, latestEvent.clientX, latestEvent.clientY);
      grid.style.setProperty("--grid-pointer-active", "1");
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      latestEvent = event;
      if (!frame) frame = window.requestAnimationFrame(updatePointerField);
    };
    const onPointerLeave = () => {
      latestEvent = null;
      grid.style.setProperty("--grid-pointer-client-x", "-1px");
      grid.style.setProperty("--grid-pointer-client-y", "-1px");
      updateKiteDartHover(grid, null, null);
      grid.style.setProperty("--grid-pointer-active", "0");
    };

    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    hero.addEventListener("pointercancel", onPointerLeave, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      hero.removeEventListener("pointercancel", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    let revealTimer = 0;
    let enterFrame = 0;
    const rotationTimer = window.setInterval(() => {
      setHeroTitlePhase("exit");
      revealTimer = window.setTimeout(() => {
        setHeroTitleIndex((current) => (current + 1) % heroTitleKeys.length);
        setHeroTitlePhase("enter-start");
        enterFrame = window.requestAnimationFrame(() => setHeroTitlePhase("present"));
      }, heroExitDuration);
    }, HERO_ROTATION_INTERVAL);
    return () => {
      window.clearInterval(rotationTimer);
      window.clearTimeout(revealTimer);
      window.cancelAnimationFrame(enterFrame);
    };
  }, [heroExitDuration]);

  const copyInstallCommand = async () => {
    try {
      let copiedToClipboard = false;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(command);
          copiedToClipboard = true;
        } catch {
          copiedToClipboard = false;
        }
      }
      if (!copiedToClipboard && typeof document !== "undefined") {
        const helper = document.createElement("textarea");
        helper.value = command;
        helper.setAttribute("readonly", "true");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        copiedToClipboard = document.execCommand("copy");
        helper.remove();
      }
      if (!copiedToClipboard) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    const titleText = heroTitleTextRef.current;
    if (!titleText) return;

    const measureTitle = () => {
      const width = Math.ceil(titleText.getBoundingClientRect().width);
      setHeroTitleWidth((current) => (current === width ? current : width));
    };

    measureTitle();
    const observer = new ResizeObserver(measureTitle);
    observer.observe(titleText);
    return () => observer.disconnect();
  }, [heroTitle]);

  const handleHeroClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button, a, input, select, textarea")) {
      return;
    }

    const hero = heroRef.current;
    if (!hero) return;

    const bounds = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100));
    clickTokenRef.current += 1;
    setTransitionRequest({
      origin: { x, y },
      token: clickTokenRef.current,
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[75svh] flex-col items-center justify-start overflow-hidden bg-[var(--line-background)] px-4 pb-20 pt-24 text-center md:px-8 md:pt-28"
      onClick={handleHeroClick}
    >
      <StartupGridBackground gridRef={gridRef} transitionRequest={transitionRequest} />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <h1 className="mb-7 w-full max-w-3xl text-balance font-[var(--font-display)] text-5xl font-semibold leading-[1.15] tracking-normal text-[var(--line-foreground)] lg:max-w-3xl lg:text-[52px]">
          <span className="block">
            <span>
              {t("startup.heroTitlePrefix")}
              {t("startup.heroTitleJoiner")}
            </span>
            <span className="hero-cover hero-cover--active">
              <span
                className="hero-cover__viewport"
                style={heroTitleWidth === null ? undefined : { width: `${heroTitleWidth}px` }}
              >
                <span
                  ref={heroTitleTextRef}
                  aria-atomic="true"
                  aria-live="polite"
                  className="hero-cover__text inline-flex whitespace-nowrap"
                >
                  <HeroTitleGlyphs
                    glyphStagger={heroGlyphStagger}
                    phase={heroTitlePhase}
                    title={heroTitle}
                    titleIndex={heroTitleIndex}
                  />
                </span>
              </span>
            </span>
          </span>
          <span className="block">{t("startup.heroTitleLine2")}</span>
        </h1>
        <p className="startup-hero__description mt-7 max-w-2xl text-pretty text-base leading-7 text-[var(--line-muted)] md:text-lg">
          {t("startup.heroDescription")}
        </p>
        <div className="mt-12 w-full max-w-3xl text-left">
          <div className="mb-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[var(--line-muted)]">
              {t("startup.quickStart")}
            </h2>
          </div>
          <div className="overflow-hidden border border-[var(--line-border)] bg-[var(--line-surface)]">
            <div className="flex min-h-12 items-end gap-6 border-b border-[var(--line-border)] px-5">
              <span className="self-center font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]">
                {t("startup.installCommandLabel")}
              </span>
              <div className="flex items-stretch gap-5">
                {(["npm", "pnpm", "bun"] as PackageManager[]).map((manager) => (
                  <Button
                    aria-pressed={packageManager === manager}
                    className={
                      packageManager === manager
                        ? "h-12 rounded-none border-0 border-b-2 border-b-[var(--line-accent)] px-0 font-mono text-xs font-semibold text-[var(--line-accent)] hover:bg-transparent"
                        : "h-12 rounded-none border-0 px-0 font-mono text-xs text-[var(--line-muted)] hover:bg-transparent hover:text-[var(--line-accent)]"
                    }
                    key={manager}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPackageManager(manager);
                      setCopied(false);
                    }}
                  >
                    {manager}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <div className="flex min-h-12 items-center gap-3 border border-[var(--line-border)] bg-[var(--line-surface-raised)] px-4 py-2.5 text-left">
                <span aria-hidden="true" className="font-mono text-[var(--line-accent)]">
                  $
                </span>
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--line-foreground)] sm:text-sm">
                  {command}
                </code>
                <Button
                  aria-label={copied ? t("startup.copiedInstall") : t("startup.copyInstall")}
                  className="size-8 shrink-0 rounded-md border-0 text-[var(--line-muted)] hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]"
                  size="icon"
                  variant="ghost"
                  onClick={copyInstallCommand}
                >
                  {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

StartupHero.displayName = "StartupHero";
