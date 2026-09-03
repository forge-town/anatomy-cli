import { AlertCircle, ArrowRight, Braces, CheckCircle2, Copy, FileCode2, Folder, FolderOpen, Menu, Moon, Sun, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

const route = (href: string) => href as never;

const StartupLogo = () => <span className="inline-flex items-center text-sm font-semibold tracking-[0.12em] text-[var(--line-foreground)]">Anatomy CLI</span>;

type GridRef = { current: HTMLDivElement | null };

const StartupGridBackground = ({ gridRef }: { gridRef: GridRef }) => <div ref={gridRef} aria-hidden="true" className="startup-grid-background pointer-events-none absolute inset-0 z-0">
  <span className="startup-grid-background__pattern startup-grid-background__pattern--triangle" />
  <span className="startup-grid-background__pattern startup-grid-background__pattern--hexagon" />
  <span className="startup-grid-background__pattern startup-grid-background__pattern--square-diamond" />
  <span className="startup-grid-background__pattern startup-grid-background__pattern--octagon" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--vertical startup-grid-background__wave-line--far-before" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--vertical startup-grid-background__wave-line--near-before" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--vertical startup-grid-background__wave-line--current" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--vertical startup-grid-background__wave-line--near-after" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--vertical startup-grid-background__wave-line--far-after" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--horizontal startup-grid-background__wave-line--far-before" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--horizontal startup-grid-background__wave-line--near-before" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--horizontal startup-grid-background__wave-line--current" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--horizontal startup-grid-background__wave-line--near-after" />
  <span className="startup-grid-background__wave-line startup-grid-background__wave-line--horizontal startup-grid-background__wave-line--far-after" />
</div>;

type StructureTreeRowProps = {
  icon: LucideIcon;
  label: string;
  indent?: 0 | 1 | 2;
  status?: "pass" | "warn" | "error";
};

const StructureTreeRow = ({ icon: Icon, label, indent = 0, status }: StructureTreeRowProps) => {
  const indentClass = indent === 2 ? "pl-12" : indent === 1 ? "pl-6" : "pl-0";
  const iconTone = status === "error" ? "text-red-500" : status === "warn" ? "text-[var(--line-accent)]" : "text-[var(--line-muted)]";
  return <div className={`flex min-h-10 items-center gap-3 border-b border-[var(--line-border)] px-2 text-sm last:border-b-0 ${indentClass} ${status === "warn" ? "bg-[var(--line-warning-surface)]" : ""}`}>
    <Icon aria-hidden="true" className={`size-3.5 shrink-0 ${iconTone}`} />
    <code className="font-mono text-[12px] text-[var(--line-foreground)]">{label}</code>
    {status && <span className="ml-auto inline-flex items-center">
      {status === "pass" ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-[var(--line-success)]" /> : <AlertCircle aria-hidden="true" className={`size-3.5 ${status === "warn" ? "text-[var(--line-accent)]" : "text-red-500"}`} />}
    </span>}
  </div>;
};

const scanRows = [
  { icon: FolderOpen, label: "src/", status: "pass" as const },
  { icon: Folder, label: "components/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "ui/", indent: 2 as const, status: "pass" as const },
  { icon: Folder, label: "routes/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "lib/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "tests/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "legacy/", indent: 1 as const, status: "warn" as const },
];

const definitionExample = `{
  "root": {
    "children": [
      {
        "kind": "directory",
        "name": { "type": "literal", "value": "src" },
        "quantity": "exactly_one",
        "children": [
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "components" },
            "quantity": "exactly_one",
            "children": [
              {
                "kind": "directory",
                "name": { "type": "literal", "value": "ui" },
                "quantity": "exactly_one",
                "children": []
              }
            ]
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "routes" },
            "quantity": "exactly_one",
            "children": []
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "lib" },
            "quantity": "exactly_one",
            "children": []
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "tests" },
            "quantity": "exactly_one",
            "children": []
          }
        ]
      }
    ]
  }
}`;

const humanDefinitionRows = [
  { key: "definitionRootRule", path: "src/" },
  { key: "definitionComponentsRule", path: "src/components/" },
  { key: "definitionUiRule", path: "src/components/ui/" },
  { key: "definitionRoutesRule", path: "src/routes/" },
  { key: "definitionLibRule", path: "src/lib/" },
  { key: "definitionTestsRule", path: "src/tests/" },
] as const;

const StructureScanPreview = ({ onStageChange }: { onStageChange?: (stage: number) => void }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scanStage, setScanStage] = useState(0);
  const [showJson, setShowJson] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    let frame = 0;
    const updateStage = () => {
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const start = window.innerHeight * 0.84;
      const end = window.innerHeight * 0.5;
      const progress = Math.max(0, Math.min(1, (start - center) / (start - end)));
      const nextStage = Math.min(scanRows.length, Math.ceil(progress * scanRows.length));
      setScanStage((current) => Math.max(current, nextStage));
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateStage);
    };
    updateStage();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateStage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateStage);
    };
  }, []);

  useEffect(() => {
    onStageChange?.(scanStage);
  }, [onStageChange, scanStage]);

  return <div ref={previewRef} data-scan-stage={scanStage} className="grid overflow-hidden bg-[var(--line-surface)] text-left md:grid-cols-2">
    <div className="border-b border-[var(--line-border)] px-5 py-6 md:border-b-0 md:border-r md:px-8 md:py-8">
      <div className="flex h-8 items-center justify-between gap-4 border-b border-[var(--line-border)]">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]"><FileCode2 aria-hidden="true" className="size-3.5 shrink-0 text-[var(--line-accent)]" /> {showJson ? "anatomy.json" : t("startup.definitionHumanLabel")}</div>
        <Button aria-label={showJson ? t("startup.definitionHumanToggle") : t("startup.definitionJsonToggle")} aria-pressed={showJson} className="size-7 shrink-0 rounded-sm border-0 bg-transparent p-0 text-[var(--line-muted)] shadow-none hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]" size="icon" title={showJson ? t("startup.definitionHumanToggle") : t("startup.definitionJsonToggle")} variant="ghost" onClick={() => setShowJson((current) => !current)}><Braces aria-hidden="true" className="size-3.5" /></Button>
      </div>
      <div className="relative mt-5 h-[20rem] overflow-hidden">
        <div aria-hidden={showJson} className={`absolute inset-0 overflow-y-auto pr-3 transition-[opacity,transform] duration-300 ease-out ${showJson ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
          <p className="text-base font-medium leading-7 tracking-[-0.01em] text-[var(--line-foreground)]">{t("startup.definitionHumanIntro")}</p>
          <div className="mt-5 space-y-3 font-mono text-xs text-[var(--line-muted)]">
            {humanDefinitionRows.map((row, index) => <div className="flex items-center gap-3 border-b border-[var(--line-border)] pb-3 last:border-b-0" key={row.key}><span className="w-5 shrink-0 text-[10px] text-[var(--line-accent)]">0{index + 1}</span><code className="text-[var(--line-foreground)]">{row.path}</code><span>{t(`startup.${row.key}`)}</span><CheckCircle2 aria-hidden="true" className="ml-auto size-3.5 shrink-0 text-[var(--line-success)]" /></div>)}
          </div>
        </div>
        <pre aria-hidden={!showJson} className={`absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain whitespace-pre-wrap break-words pr-3 font-mono text-[11px] leading-5 transition-[opacity,transform] duration-300 ease-out sm:text-xs ${showJson ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>{definitionExample}</pre>
      </div>
    </div>
    <div className="bg-[var(--line-surface-raised)] px-5 py-6 md:px-8 md:py-8">
      <div className="flex h-8 items-center gap-2 border-b border-[var(--line-border)] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]"><FolderOpen aria-hidden="true" className="size-3.5 text-[var(--line-accent)]" /> src/</div>
      <div className="mt-5">
        {scanRows.map((row, index) => <div className={["transition-[opacity,transform] duration-500", scanStage > index ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"].join(" ")} key={row.label}><StructureTreeRow icon={row.icon} label={row.label} indent={row.indent} status={row.status} /></div>)}
      </div>
    </div>
  </div>;
};

const StartupHeader = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("anatomy-theme");
    const nextDark = stored === "dark";
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("anatomy-theme", next ? "dark" : "light");
  };

  return <header className="sticky top-0 z-50 bg-[color-mix(in_srgb,var(--line-background)_92%,transparent)] px-4 backdrop-blur-xl sm:px-8">
    <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4">
      <Link aria-label="Anatomy CLI" className="shrink-0" to="/"><StartupLogo /></Link>
      <div className="hidden items-center gap-4 md:flex">
        <Button aria-label={dark ? t("startup.lightTheme") : t("startup.darkTheme")} className="size-9 rounded-md border-0 text-[var(--line-muted)] hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]" size="icon" variant="ghost" onClick={toggleTheme}>{dark ? <Sun size={16} /> : <Moon size={16} />}</Button>
        <LanguageSwitcher startup />
        <Link className="text-sm font-semibold text-[var(--line-foreground)] hover:text-[var(--line-muted)]" to={route("/docs/installation")}>{t("startup.login")}</Link>
        <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} size="sm" className="rounded-md border border-[var(--line-border-strong)] bg-transparent px-4 text-sm font-semibold text-[var(--line-foreground)] shadow-none hover:bg-[var(--line-hover)]">{t("startup.headerCta")}</Button>
      </div>
      <Button aria-label={menuOpen ? t("startup.closeMenu") : t("startup.openMenu")} className="size-9 rounded-md border border-[var(--line-border)] bg-transparent text-[var(--line-foreground)] md:hidden" size="icon" variant="outline" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</Button>
    </div>
    {menuOpen && <div className="mx-auto max-w-7xl border-x border-b border-[var(--line-border)] bg-[var(--line-background)] p-3 md:hidden">
      <a className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]" href="#scan" onClick={() => setMenuOpen(false)}>{t("startup.scanNav")}</a>
      <a className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]" href="#features" onClick={() => setMenuOpen(false)}>{t("startup.capabilitiesNav")}</a>
      <a className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]" href="#contact" onClick={() => setMenuOpen(false)}>{t("startup.contactNav")}</a>
      <div className="px-3 py-2.5"><LanguageSwitcher startup /></div>
      <Link className="block px-3 py-2.5 text-sm font-semibold text-[var(--line-foreground)] hover:text-[var(--line-muted)]" to={route("/docs/installation")} onClick={() => setMenuOpen(false)}>{t("startup.login")}</Link>
      <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} className="mt-2 w-full rounded-md border border-[var(--line-accent)] bg-[var(--line-accent)] text-[var(--line-background)] shadow-none hover:bg-[var(--line-foreground)] hover:text-[var(--line-background)]">{t("startup.headerCta")}</Button>
    </div>}
  </header>;
};

type PackageManager = "npm" | "pnpm" | "bun";

const heroTitleKeys = ["startup.heroTitleLine1", "startup.heroTitleLine1Alt", "startup.heroTitleLine1Alt2"] as const;
type HeroTitlePhase = "present" | "exit" | "enter-start";
const HERO_GLYPH_STAGGER = 50;
const HERO_GLYPH_DURATION = 360;

const installCommands: Record<PackageManager, string> = {
  npm: "npm install -g --ignore-scripts anatomy-cli",
  pnpm: "pnpm add -g --ignore-scripts anatomy-cli",
  bun: "bun add -g --ignore-scripts anatomy-cli",
};

const StartupHero = () => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);
  const [heroTitleIndex, setHeroTitleIndex] = useState(0);
  const [heroTitlePhase, setHeroTitlePhase] = useState<HeroTitlePhase>("present");
  const command = installCommands[packageManager];
  const maxHeroTitleLength = Math.max(...heroTitleKeys.map((key) => Array.from(t(key)).length));
  const heroExitDuration = HERO_GLYPH_DURATION + Math.max(0, maxHeroTitleLength - 1) * HERO_GLYPH_STAGGER;

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
      const gridStep = 72;
      grid.style.setProperty("--grid-wave-x", `${Math.round(x / gridStep) * gridStep}px`);
      grid.style.setProperty("--grid-wave-y", `${Math.round(y / gridStep) * gridStep}px`);
      grid.style.setProperty("--grid-pointer-active", "1");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      latestEvent = event;
      if (!frame) frame = window.requestAnimationFrame(updatePointerField);
    };
    const onPointerLeave = () => {
      latestEvent = null;
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
    }, 3400);
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

  const heroTitle = t(heroTitleKeys[heroTitleIndex] ?? heroTitleKeys[0]);

  return <section ref={heroRef} className="relative flex min-h-[75svh] flex-col items-center justify-start overflow-hidden bg-[var(--line-background)] px-4 pb-20 pt-24 text-center md:px-8 md:pt-28">
    <StartupGridBackground gridRef={gridRef} />
    <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
      <h1 className="mb-7 w-full max-w-3xl text-balance font-[var(--font-display)] text-5xl font-semibold leading-[1.15] tracking-normal text-[var(--line-foreground)] lg:max-w-xl lg:text-[52px]"><span className="block"><span>{t("startup.heroTitlePrefix")}{t("startup.heroTitleJoiner")}</span><span className="hero-cover hero-cover--active"><span className="hero-cover__viewport"><span aria-atomic="true" aria-live="polite" className="hero-cover__text inline-flex whitespace-nowrap">{Array.from(heroTitle).map((character, index) => <span className={`hero-cover__glyph hero-cover__glyph--${heroTitlePhase}`} key={`${heroTitleIndex}-${index}`} style={{ transitionDelay: `${index * HERO_GLYPH_STAGGER}ms` }}>{character}</span>)}</span></span></span></span><span className="block">{t("startup.heroTitleLine2")}</span></h1>
      <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-[var(--line-muted)] md:text-lg">{t("startup.heroDescription")}</p>
      <div className="mt-12 w-full max-w-3xl text-left">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[var(--line-muted)]">{t("startup.quickStart")}</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--line-muted)]">Anatomy CLI</span>
        </div>
        <div className="overflow-hidden border border-[var(--line-border)] bg-[var(--line-surface)]">
          <div className="flex min-h-12 items-end gap-6 border-b border-[var(--line-border)] px-5">
            <span className="self-center font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]">{t("startup.installCommandLabel")}</span>
            <div className="flex items-stretch gap-5">
              {(["npm", "pnpm", "bun"] as PackageManager[]).map((manager) => <Button aria-pressed={packageManager === manager} className={packageManager === manager ? "h-12 rounded-none border-0 border-b-2 border-b-[var(--line-accent)] px-0 font-mono text-xs font-semibold text-[var(--line-accent)] hover:bg-transparent" : "h-12 rounded-none border-0 px-0 font-mono text-xs text-[var(--line-muted)] hover:bg-transparent hover:text-[var(--line-accent)]"} key={manager} size="sm" variant="ghost" onClick={() => { setPackageManager(manager); setCopied(false); }}>{manager}</Button>)}
            </div>
          </div>
          <div className="p-5">
            <div className="flex min-h-12 items-center gap-3 border border-[var(--line-border)] bg-[var(--line-surface-raised)] px-4 py-2.5 text-left">
              <span aria-hidden="true" className="font-mono text-[var(--line-accent)]">$</span>
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--line-foreground)] sm:text-sm">{command}</code>
              <Button aria-label={copied ? t("startup.copiedInstall") : t("startup.copyInstall")} className="size-8 shrink-0 rounded-md border-0 text-[var(--line-muted)] hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]" size="icon" variant="ghost" onClick={copyInstallCommand}>{copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
};

const StartupScanSection = () => {
  const { t } = useTranslation();
  const [scanStage, setScanStage] = useState(0);
  const matchingRows = scanRows.filter((row) => row.status === "pass").length;
  const warningRows = scanRows.filter((row) => row.status === "warn").length;
  const scanComplete = scanStage >= scanRows.length;
  return <section id="scan" className="relative w-full border-y border-[var(--line-border)] bg-[var(--line-background)] px-4 pb-2 pt-0 md:px-8 md:pb-3">
    <div className="mx-auto max-w-6xl">
      <StructureScanPreview onStageChange={setScanStage} />
      <div className={["grid gap-5 border-t border-[var(--line-border)] px-5 py-4 transition-[opacity,transform] duration-700 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-8", scanComplete ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"].join(" ")}>
        <div className="min-w-0">
          <p className="max-w-xl text-base font-medium leading-7 tracking-[-0.01em] text-[var(--line-foreground)]">{t("startup.scanResultDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs">
          <span className="inline-flex items-center gap-2 text-[var(--line-success)]"><CheckCircle2 aria-hidden="true" className="size-3.5" />{matchingRows} {t("startup.previewMatches")}</span>
          <span className="inline-flex items-center gap-2 text-[var(--line-accent)]"><AlertCircle aria-hidden="true" className="size-3.5" />{warningRows} {t("startup.previewWarnings")}</span>
          <span className="text-[var(--line-muted)]">{scanRows.length} {t("startup.previewEntries")}</span>
        </div>
      </div>
    </div>
  </section>;
};

const CapabilityCard = ({ index, title, copy, children }: { index: number; title: string; copy: string; children: ReactNode }) => <article className={`min-w-0 border-t border-[var(--line-border)] pt-5 ${index === 1 ? "md:pr-6" : "md:border-l md:pl-6 md:pr-6"}`}>
  <div className="flex items-baseline gap-4"><span className="shrink-0 font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--line-accent)]">0{index}</span><h3 className="min-w-0 text-left text-lg font-semibold tracking-[-0.02em] text-[var(--line-foreground)]">{title}</h3></div>
  <p className="mt-3 min-h-0 max-w-sm text-pretty text-sm leading-6 text-[var(--line-muted)] md:min-h-[4.5rem]">{copy}</p>
  <div className="mt-8 min-w-0">{children}</div>
</article>;

const StartupFeatures = () => {
  const { t } = useTranslation();
  return <section id="features" className="w-full border-t border-[var(--line-border)] bg-[var(--line-background)] px-4 py-20 md:px-8 md:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-2xl"><h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">{t("startup.featuresTitle")}</h2><p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">{t("startup.featuresDescription")}</p></div>
      <div className="mt-14 grid min-w-0 items-stretch gap-10 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-0">
        <CapabilityCard index={1} title={t("startup.oneClickTitle")} copy={t("startup.oneClickCopy")}><div className="font-mono text-xs text-[var(--line-foreground)]"><div className="flex items-center gap-3 border-y border-[var(--line-border)] py-3"><span className="text-[var(--line-muted)]">01</span><code>anatomy.json</code><CheckCircle2 className="ml-auto size-4 text-[var(--line-success)]" /></div><div className="flex items-center gap-3 border-b border-[var(--line-border)] py-3"><span className="text-[var(--line-muted)]">02</span><code>anatomy check ./src</code><ArrowRight className="ml-auto size-4 text-[var(--line-accent)]" /></div></div></CapabilityCard>
        <CapabilityCard index={2} title={t("startup.workflowTitle")} copy={t("startup.workflowCopy")}><div className="border-y border-[var(--line-border)] py-4 font-mono text-[11px] leading-5 text-[var(--line-muted)]"><div className="mb-3 flex items-center gap-2 text-[var(--line-foreground)]"><FileCode2 className="size-4 text-[var(--line-accent)]" /> anatomy.json</div><pre className="overflow-x-auto whitespace-pre">{`{\n  "root": {\n    "children": [...]\n  }\n}`}</pre></div></CapabilityCard>
        <CapabilityCard index={3} title={t("startup.edgeTitle")} copy={t("startup.edgeCopy")}><div className="font-mono text-xs text-[var(--line-foreground)]"><div className="flex items-center gap-2 border-y border-[var(--line-border)] py-3 text-[var(--line-success)]"><CheckCircle2 className="size-4" /> 4 {t("startup.previewMatches")}</div><div className="flex items-center gap-2 border-b border-[var(--line-border)] py-3 text-[var(--line-accent)]"><AlertCircle className="size-4" /> 1 {t("startup.previewWarnings")}</div><div className="border-b border-[var(--line-border)] py-3 text-[var(--line-muted)]">local · pull request · CI</div></div></CapabilityCard>
      </div>
    </div>
  </section>;
};

const StartupCta = () => {
  const { t } = useTranslation();
  return <section id="contact" className="w-full border-t border-[var(--line-border)] bg-[var(--line-surface)] px-4 py-20 md:px-8 md:py-24"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><h2 className="max-w-xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">{t("startup.ctaTitle")}</h2><p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">{t("startup.ctaDescription")}</p></div><Button nativeButton={false} render={<Link to={route("/docs/installation")} />} className="h-11 rounded-md border border-[var(--line-foreground)] bg-[var(--line-foreground)] px-5 text-sm font-semibold text-[var(--line-background)] shadow-none hover:bg-[var(--line-muted)]">{t("startup.ctaButton")}<ArrowRight size={15} /></Button></div></section>;
};

const StartupFooter = () => {
  const { t } = useTranslation();
  return <footer className="overflow-hidden border-t border-[var(--line-border)] bg-[var(--line-background)] px-8 py-16 text-sm text-[var(--line-muted)]"><div className="mx-auto flex max-w-7xl flex-col items-start gap-12 md:flex-row md:px-8"><div className="w-full flex-1"><StartupLogo /><p className="mt-5 max-w-[260px] text-pretty leading-6">{t("startup.footerDescription")}</p><p className="mt-8 text-xs">{t("startup.copyright")}</p></div><div className="grid w-full grid-cols-2 gap-10 md:w-[460px] md:grid-cols-3"><div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerPages")}</p><a className="block hover:text-[var(--line-foreground)]" href="#">{t("startup.home")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#scan">{t("startup.scanNav")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#features">{t("startup.capabilitiesNav")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#contact">{t("startup.contactNav")}</a></div><div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerSocials")}</p><a className="block hover:text-[var(--line-foreground)]" href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">GitHub</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#">X / Twitter</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#">Discord</a></div><div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerRegister")}</p><Link className="block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.signup")}</Link><Link className="mt-3 block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.login")}</Link><Link className="mt-3 block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.bookDemo")}</Link></div></div></div><p aria-hidden="true" className="mt-16 whitespace-nowrap text-center text-5xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--line-border-strong)] sm:text-8xl md:text-[13rem]">ANATOMY CLI</p></footer>;
};

export const StartupHome = () => <div className="min-h-screen bg-[var(--line-background)] text-[var(--line-foreground)]"><StartupHeader /><main><StartupHero /><StartupScanSection /><StartupFeatures /><StartupCta /></main><StartupFooter /></div>;
