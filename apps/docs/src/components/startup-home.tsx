import { ArrowRight, Check, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";

const dashboardNew = "https://assets.aceternity.com/pro/dashboard-new.webp";
const dashboard = "https://assets.aceternity.com/pro/dashboard.webp";
const avatars = [
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=128&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=128&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80",
  "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=128&q=80",
];

const route = (href: string) => href as never;

const StartupLogo = () => <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.18em] text-neutral-950"><img alt="" className="size-7 rounded-sm" src="/logo.svg" /><span>ANATOMY</span></span>;

const StartupGridBackground = () => {
  const gridLineStyle = {
    "--background": "#ffffff",
    "--color": "rgba(0, 0, 0, 0.2)",
    "--height": "5px",
    "--width": "1px",
    "--fade-stop": "90%",
    "--offset": "150px",
  } as CSSProperties;
  const gridLineClass = "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)] bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)] [background-size:var(--width)_var(--height)] [mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)] [mask-composite:exclude] z-30";

  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 md:grid-cols-4">
    {Array.from({ length: 4 }, (_, index) => <div className="relative h-full w-full" key={index}>
      <div className={`${gridLineClass} left-0`} style={gridLineStyle} />
      <div className={`${gridLineClass} left-auto right-0`} style={gridLineStyle} />
    </div>)}
    {[-400, -200, 200, 400].map((offset) => <div className="absolute left-96 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-orange-500 via-yellow-500 to-transparent" key={offset} style={{ transform: `translateX(${offset}px) translateY(-200px) rotate(-45deg)` }} />)}
  </div>;
};

const StartupHeader = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return <header className="fixed inset-x-0 top-0 z-50 px-4 py-3 sm:px-8">
    <div className={`mx-auto flex h-12 items-center justify-between transition-[max-width,background-color,box-shadow,border-radius,padding] duration-300 ${scrolled ? "max-w-5xl rounded-full border border-neutral-200 bg-white/90 px-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl" : "w-full px-1"}`}>
      <Link aria-label="Anatomy" className="shrink-0" to="/"><StartupLogo /></Link>
      <nav className="hidden items-center gap-9 text-sm text-neutral-600 md:flex" aria-label={t("startup.navigationLabel")}>
        <a className="transition-colors hover:text-neutral-950" href="#features">{t("startup.featuresNav")}</a>
        <a className="transition-colors hover:text-neutral-950" href="#pricing">{t("startup.pricingNav")}</a>
        <a className="transition-colors hover:text-neutral-950" href="#contact">{t("startup.contactNav")}</a>
      </nav>
      <div className="hidden items-center gap-4 md:flex">
        <Button aria-label={dark ? t("startup.lightTheme") : t("startup.darkTheme")} className="size-9 rounded-lg border-0 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" size="icon" variant="ghost" onClick={toggleTheme}>{dark ? <Sun size={16} /> : <Moon size={16} />}</Button>
        <LanguageSwitcher startup />
        <Link className="text-sm font-semibold text-neutral-950 hover:text-neutral-600" to={route("/docs/installation")}>{t("startup.login")}</Link>
        <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} size="sm" className="rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-neutral-50">{t("startup.headerCta")}</Button>
      </div>
      <Button aria-label={menuOpen ? t("startup.closeMenu") : t("startup.openMenu")} className="size-9 rounded-lg border border-neutral-200 bg-white text-neutral-900 md:hidden" size="icon" variant="outline" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</Button>
    </div>
    {menuOpen && <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl md:hidden">
      <a className="block rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50" href="#features" onClick={() => setMenuOpen(false)}>{t("startup.featuresNav")}</a>
      <a className="block rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50" href="#pricing" onClick={() => setMenuOpen(false)}>{t("startup.pricingNav")}</a>
      <a className="block rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50" href="#contact" onClick={() => setMenuOpen(false)}>{t("startup.contactNav")}</a>
      <div className="px-3 py-2.5"><LanguageSwitcher startup /></div>
      <Link className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-50" to={route("/docs/installation")} onClick={() => setMenuOpen(false)}>{t("startup.login")}</Link>
      <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} className="mt-2 w-full rounded-lg">{t("startup.headerCta")}</Button>
    </div>}
  </header>;
};

const DeploymentSteps = () => {
  const { t } = useTranslation();
  return <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden px-8 pt-5">
    <div aria-hidden="true" className="absolute left-1/2 top-2 h-[210px] w-px -translate-x-1/2 bg-neutral-200" />
    <div className="relative z-10 grid w-full max-w-[520px] grid-cols-3 gap-3">
      <Card className="relative mt-8 flex h-36 items-center justify-center rounded-lg border-neutral-100 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.1)]"><code className="whitespace-pre-wrap font-mono text-[9px] leading-[1.35] text-neutral-700">git add .{`\n`}git commit -m &quot;update&quot;{`\n`}git push</code></Card>
      <Card className="flex h-36 items-center justify-center rounded-lg border-neutral-100 bg-white p-4 text-2xl font-bold tracking-[-0.08em] text-neutral-950 shadow-[0_14px_30px_rgba(15,23,42,0.1)]">GH</Card>
      <Card className="relative mt-8 flex h-36 flex-col items-center justify-center rounded-lg border-neutral-100 bg-white p-4 text-neutral-700 shadow-[0_14px_30px_rgba(15,23,42,0.1)]"><span className="text-2xl font-bold tracking-[-0.08em]">Anatomy</span><span className="mt-1 text-[9px] text-neutral-500">{t("startup.live")}</span></Card>
    </div>
  </div>;
};

const DotGlobe = () => <div aria-hidden="true" className="absolute -bottom-44 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-[#050b19] shadow-[0_-10px_60px_rgba(15,23,42,0.25)] before:absolute before:inset-8 before:rounded-full before:bg-[radial-gradient(circle_at_35%_30%,rgba(46,119,255,0.6)_0_1px,transparent_1.8px)] before:bg-[length:11px_11px] before:opacity-95 after:absolute after:inset-[110px_80px_125px] after:rounded-[45%] after:border-[22px] after:border-blue-500/10" />;

const FeatureCard = ({ title, copy, image, wide = false, showHeader = true, children }: { title: string; copy: string; image?: string; wide?: boolean; showHeader?: boolean; children?: ReactNode }) => <Card className={`relative min-h-[400px] overflow-hidden rounded-2xl border-neutral-200/80 bg-neutral-50/75 p-6 text-neutral-700 shadow-[0_12px_40px_rgba(15,23,42,0.04)] ${wide ? "md:col-span-3" : "md:col-span-2"}`}>
  {showHeader && <><h3 className="relative z-10 text-base font-medium tracking-tight text-neutral-800">{title}</h3><p className="relative z-10 mt-2 max-w-[35rem] text-base leading-6 tracking-tight text-neutral-500">{copy}</p></>}
  {image && <img alt="" className="absolute inset-x-6 bottom-0 h-auto w-[calc(100%-3rem)] rounded-lg object-cover object-top" src={image} />}
  {children}
</Card>;

const StartupHero = () => {
  const { t } = useTranslation();
  return <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-50 px-4 py-24 md:px-8 md:pb-[184.5px] md:pt-44">
    <StartupGridBackground />
    <div className="relative z-10 flex w-full flex-col items-center text-center">
      <h1 className="-mt-4 mb-7 w-full max-w-3xl text-balance font-[var(--font-display)] text-5xl font-semibold leading-[1.15] tracking-normal text-[#23272f] lg:max-w-xl lg:text-[52px]"><span className="block">{t("startup.heroTitleLine1")}</span><span className="block">{t("startup.heroTitleLine2")}</span></h1>
      <p className="relative z-20 mt-8 max-w-lg px-4 text-base leading-6 text-neutral-600">{t("startup.heroDescription")}</p>
      <div className="mt-8 hidden items-center gap-4 sm:flex">
        <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} className="h-9 w-40 rounded-md border border-neutral-950 bg-neutral-950 px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] hover:bg-neutral-800">{t("startup.heroPrimary")}<ArrowRight size={15} /></Button>
        <Button nativeButton={false} render={<a href="#contact" />} variant="outline" className="h-9 w-40 rounded-md border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-900 shadow-sm hover:bg-neutral-50">{t("startup.heroSecondary")}</Button>
      </div>
      <div className="relative mt-16 w-full max-w-7xl md:mt-[106px]">
        <div className="relative mx-auto max-w-7xl rounded-[32px] border border-neutral-200/50 bg-neutral-100 p-2 backdrop-blur-lg md:p-4">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-2">
            <img alt={t("startup.dashboardAlt")} className="w-full rounded-[20px] object-cover" src={dashboardNew} />
          </div>
        </div>
      </div>
    </div>
  </section>;
};

const StartupFeatures = () => {
  const { t } = useTranslation();
  return <section id="features" className="w-full bg-white px-4 pb-20 pt-24 md:px-8">
    <div className="mx-auto max-w-[1200px]">
      <div className="text-center"><h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">{t("startup.featuresTitle")}</h2><p className="mx-auto mt-8 max-w-lg text-sm text-neutral-500">{t("startup.featuresDescription")}</p></div>
      <div className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-5">
        <FeatureCard wide showHeader={false} title={t("startup.oneClickTitle")} copy={t("startup.oneClickCopy")}><DeploymentSteps /><div className="absolute bottom-6 left-6 right-6"><h3 className="text-base font-medium tracking-tight text-neutral-800">{t("startup.oneClickTitle")}</h3><p className="mt-2 max-w-[380px] text-base leading-6 text-neutral-500">{t("startup.oneClickCopy")}</p></div></FeatureCard>
        <FeatureCard title={t("startup.workflowTitle")} copy={t("startup.workflowCopy")} image={dashboard} />
        <FeatureCard title={t("startup.edgeTitle")} copy={t("startup.edgeCopy")}><DotGlobe /></FeatureCard>
        <FeatureCard wide title={t("startup.copyTitle")} copy={t("startup.copyCopy")} image={dashboard} />
      </div>
    </div>
  </section>;
};

type Plan = { name: string; price: string; featured?: boolean; button: string; features: string[] };

const PlanCard = ({ plan }: { plan: Plan }) => <div className="min-h-[676px] rounded-3xl border border-neutral-200/80 bg-neutral-50 p-4">
  <Card className="rounded-xl border-neutral-200 bg-white p-4 shadow-[0_2px_6px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">Featured</span>}</div><div className="mt-9 flex items-baseline gap-1 text-neutral-900"><span className="text-base text-neutral-500">$</span><strong className="text-6xl font-semibold tracking-[-0.08em]">{plan.price}</strong><span className="text-sm text-neutral-500">/month</span></div><Button className="mt-10 h-9 w-full rounded-md border-0 bg-gradient-to-b from-blue-500 to-blue-600 text-sm font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_3px_rgba(37,99,235,0.35)] hover:from-blue-600 hover:to-blue-700">{plan.button}</Button></Card><ul className="mt-11 grid gap-4 px-1 text-sm font-medium text-neutral-700">{plan.features.map((feature) => <li className="flex items-start gap-3" key={feature}><Check className="mt-0.5 size-4 shrink-0 rounded-full bg-neutral-600 p-0.5 text-white" />{feature}</li>)}</ul></div>;

const StartupPricing = () => {
  const { t } = useTranslation();
  const plans: Plan[] = [
    { name: t("startup.planHobby"), price: "99", button: t("startup.planHobbyButton"), features: [t("startup.planBasicAnalytics"), t("startup.planDataPoints"), t("startup.planEmailSupport"), t("startup.planCommunity"), t("startup.planCancel")] },
    { name: t("startup.planStarter"), price: "299", featured: true, button: t("startup.planStarterButton"), features: [t("startup.planAdvancedAnalytics"), t("startup.planReports"), t("startup.planRealtime"), t("startup.planIntegrations"), t("startup.planEverythingHobby")] },
    { name: t("startup.planPro"), price: "1490", button: t("startup.planProButton"), features: [t("startup.planStorage"), t("startup.planDashboards"), t("startup.planSegmentation"), t("startup.planProcessing"), t("startup.planAi"), t("startup.planEverythingHobby"), t("startup.planEverythingPro")] },
  ];
  return <section id="pricing" className="relative isolate w-full bg-white px-4 py-20 lg:px-4"><div className="mx-auto max-w-[1240px]"><div className="text-center"><h2 className="pt-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">{t("startup.pricingTitle")}</h2><p className="mx-auto mt-4 max-w-md text-base leading-6 text-neutral-500">{t("startup.pricingDescription")}</p></div><div className="mt-20 grid gap-4 md:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.name} plan={plan} />)}</div></div></section>;
};

const StartupCta = () => {
  const { t } = useTranslation();
  return <section id="contact" className="min-h-[504px] w-full bg-white px-4 py-20 md:px-8"><div className="mx-auto grid max-w-[1200px] items-start gap-12 md:grid-cols-[1fr_auto]"><div><h2 className="max-w-md text-center text-2xl font-bold tracking-tight text-neutral-950 md:text-left md:text-3xl">{t("startup.ctaTitle")}</h2><p className="mt-8 max-w-md text-center text-base leading-6 text-neutral-500 md:text-left">{t("startup.ctaDescription")}</p><div className="mt-9 flex items-center justify-center md:justify-start"><div className="flex -space-x-3">{avatars.map((src) => <img alt="" className="size-14 rounded-full border-2 border-white object-cover" key={src} src={src} />)}</div><div className="ml-5 text-amber-400">★★★★★<p className="mt-1 text-sm text-neutral-500">{t("startup.trusted")}</p></div></div></div><Button nativeButton={false} render={<a href="mailto:hello@anatomy.dev" />} className="mx-auto h-10 rounded-lg border border-blue-600 bg-gradient-to-b from-blue-500 to-blue-600 px-4 text-base font-medium text-white shadow-sm hover:from-blue-600 hover:to-blue-700 md:mx-0 md:self-center">{t("startup.ctaButton")}<ArrowRight size={15} /></Button></div></section>;
};

const StartupFooter = () => {
  const { t } = useTranslation();
  return <footer className="border-t border-neutral-100 bg-white px-8 py-20 text-sm text-neutral-500"><div className="mx-auto flex min-h-[200px] max-w-7xl flex-col items-start gap-12 md:flex-row md:px-8"><div className="w-full flex-1"><StartupLogo /><p className="mt-5 max-w-[260px] leading-6">{t("startup.footerDescription")}</p><p className="mt-8 text-xs">{t("startup.copyright")}</p></div><div className="grid w-full grid-cols-2 gap-10 md:w-[571px] md:grid-cols-4"><div><p className="mb-4 font-semibold text-neutral-900">{t("startup.footerPages")}</p><a className="block hover:text-neutral-950" href="#">{t("startup.home")}</a><a className="mt-3 block hover:text-neutral-950" href="#features">{t("startup.featuresNav")}</a><a className="mt-3 block hover:text-neutral-950" href="#pricing">{t("startup.pricingNav")}</a><a className="mt-3 block hover:text-neutral-950" href="#contact">{t("startup.contactNav")}</a><a className="mt-3 block hover:text-neutral-950" href="#">Blog</a></div><div><p className="mb-4 font-semibold text-neutral-900">{t("startup.footerSocials")}</p><a className="block hover:text-neutral-950" href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">GitHub</a><a className="mt-3 block hover:text-neutral-950" href="#">X / Twitter</a><a className="mt-3 block hover:text-neutral-950" href="#">Discord</a><a className="mt-3 block hover:text-neutral-950" href="#">LinkedIn</a></div><div><p className="mb-4 font-semibold text-neutral-900">{t("startup.footerLegal")}</p><a className="block hover:text-neutral-950" href="#">{t("startup.privacy")}</a><a className="mt-3 block hover:text-neutral-950" href="#">{t("startup.terms")}</a><a className="mt-3 block hover:text-neutral-950" href="#">{t("startup.cookies")}</a></div><div><p className="mb-4 font-semibold text-neutral-900">{t("startup.footerRegister")}</p><Link className="block hover:text-neutral-950" to={route("/docs/installation")}>{t("startup.signup")}</Link><Link className="mt-3 block hover:text-neutral-950" to={route("/docs/installation")}>{t("startup.login")}</Link><Link className="mt-3 block hover:text-neutral-950" to={route("/docs/installation")}>{t("startup.bookDemo")}</Link></div></div></div><p aria-hidden="true" className="mt-20 text-center text-5xl font-bold uppercase leading-none tracking-[-0.08em] text-neutral-100 sm:text-8xl md:text-[13rem]">ANATOMY</p></footer>;
};

export const StartupHome = () => <div className="min-h-screen bg-white text-neutral-900"><StartupHeader /><main><StartupHero /><StartupFeatures /><StartupPricing /><StartupCta /></main><StartupFooter /></div>;
