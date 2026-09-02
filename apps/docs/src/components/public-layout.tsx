import { ChevronDown, Menu, Moon, Play, Search, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/language-switcher";

const navItems = [
  { key: "guide", href: "/docs/installation" },
  { key: "config", href: "/docs/cli" },
  { key: "concepts", href: "/docs/anatomy" },
] as const;

const toRoute = (href: string) => href as never;

export const Brand = ({ immersive = false, mono = false }: { immersive?: boolean; mono?: boolean }) => (
  <span className={`inline-flex items-center gap-2.5 font-mono text-[13px] font-semibold tracking-[0.14em] ${immersive ? "text-white" : mono ? "text-[#26352e]" : ""}`}>
    <span className={`grid size-8 place-items-center rounded-full ${immersive ? "bg-white text-[#0d0d18]" : mono ? "skew-y-[-8deg] grid-cols-2 gap-[3px] bg-[#d5ef91] p-[5px]" : "skew-y-[-8deg] grid-cols-2 gap-[3px] bg-[var(--primary)] p-[5px]"}`}>
      {immersive ? <Play size={14} fill="currentColor" strokeWidth={0} /> : <><i className="bg-[var(--primary-foreground)]" /><i className="bg-[var(--primary-foreground)]" /><i className="bg-[var(--primary-foreground)]" /><i className="bg-[var(--primary-foreground)]" /></>}
    </span>
    <span>ANATOMY</span>
  </span>
);

const ThemeToggle = ({ immersive = false }: { immersive?: boolean }) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("anatomy-theme");
    const nextDark = stored === "dark";
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.localStorage.setItem("anatomy-theme", nextDark ? "dark" : "light");
  };

  return <Button aria-label={dark ? "切换到浅色主题" : "切换到深色主题"} className={`size-9 ${immersive ? "border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]" : ""}`} size="icon" variant="outline" onClick={toggle}>{dark ? <Sun size={15} /> : <Moon size={15} />}</Button>;
};

const HeaderDropdown = ({ label, children, immersive = false }: { label: string; children: ReactNode; immersive?: boolean }) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button className={`gap-1.5 px-3 text-[13px] ${immersive ? "text-white/75 hover:bg-white/[0.08] hover:text-white" : ""}`} size="sm" variant="ghost" />}>
      {label}<ChevronDown size={14} />
    </DropdownMenuTrigger>
    <DropdownMenuContent>{children}</DropdownMenuContent>
  </DropdownMenu>
);

export const PublicHeader = ({ immersive = false, mono = false }: { immersive?: boolean; mono?: boolean }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const headerClass = immersive
    ? "fixed inset-x-0 top-0 z-30 rounded-b-[15px] border-b border-white/10 bg-[rgba(13,13,24,0.3)] text-white backdrop-blur-lg"
    : "sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl";
  const navText = immersive ? "text-white/65 hover:text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

  if (mono) {
    return <header className="relative z-30 grid h-16 shrink-0 grid-cols-[1fr_auto] items-center border-b-2 border-[#26352e] bg-[#f2efe8] px-4 text-[#26352e] sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
      <Link className="shrink-0" to="/"><Brand mono /></Link>
      <p className="hidden whitespace-nowrap text-center font-mono text-[10px] font-bold uppercase leading-none tracking-[0.16em] lg:block">ANATOMY / STRUCTURE INDEX</p>
      <div className="ml-auto flex items-center gap-3">
        <nav className="hidden items-center gap-4 font-mono text-[11px] font-bold uppercase tracking-[0.11em] lg:flex" aria-label="主导航">
          <Link className="transition-colors hover:text-[#d9654b]" to={toRoute("/docs/installation")}>{t("navigation.guide")}</Link>
          <Link className="transition-colors hover:text-[#d9654b]" to={toRoute("/docs/cli")}>{t("navigation.config")}</Link>
          <Link className="transition-colors hover:text-[#d9654b]" to={toRoute("/docs/anatomy")}>{t("navigation.concepts")}</Link>
          <Link className="transition-colors hover:text-[#d9654b]" to={toRoute("/docs/ci")}>{t("navigation.resources")}</Link>
        </nav>
        <a className="hidden font-mono text-[11px] font-bold uppercase tracking-[0.11em] transition-colors hover:text-[#d9654b] sm:inline" href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">{t("navigation.github")}</a>
        <div className="max-[560px]:hidden"><LanguageSwitcher mono /></div>
        <Button aria-label={mobileOpen ? "关闭导航" : "打开导航"} className="border-[#26352e]/35 bg-transparent text-[#26352e] hover:bg-[#dbe5dd] lg:hidden" size="icon" variant="outline" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</Button>
      </div>
      {mobileOpen && <nav className="absolute inset-x-0 top-full border-b-2 border-[#26352e] bg-[#f2efe8] px-5 py-3 shadow-[0_8px_0_rgba(38,53,46,0.12)] lg:hidden" aria-label="移动端主导航">
        <Link className="block border-b border-[#26352e]/20 py-3 font-mono text-xs font-bold uppercase" to={toRoute("/docs/installation")} onClick={() => setMobileOpen(false)}>{t("navigation.guide")}</Link>
        <Link className="block border-b border-[#26352e]/20 py-3 font-mono text-xs font-bold uppercase" to={toRoute("/docs/cli")} onClick={() => setMobileOpen(false)}>{t("navigation.config")}</Link>
        <Link className="block border-b border-[#26352e]/20 py-3 font-mono text-xs font-bold uppercase" to={toRoute("/docs/anatomy")} onClick={() => setMobileOpen(false)}>{t("navigation.concepts")}</Link>
        <Link className="block py-3 font-mono text-xs font-bold uppercase" to={toRoute("/docs/ci")} onClick={() => setMobileOpen(false)}>{t("navigation.resources")}</Link>
        <div className="mt-2"><LanguageSwitcher mono /></div>
      </nav>}
    </header>;
  }

  if (immersive) {
    return <header className={headerClass}>
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center gap-8 px-7 max-[560px]:px-[18px]">
        <Link className="shrink-0" to="/"><Brand immersive /></Link>
        <nav className="hidden items-center gap-1 min-[900px]:flex" aria-label="主导航">
          <HeaderDropdown immersive label={t("navigation.features")}>
            <DropdownMenuItem render={<Link to={toRoute("/docs/anatomy")} />}>{t("navigation.anatomyConcepts")}</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={toRoute("/docs/definition")} />}>{t("navigation.definitionSchema")}</DropdownMenuItem>
          </HeaderDropdown>
          <HeaderDropdown immersive label={t("navigation.enterprise")}>
            <DropdownMenuItem render={<Link to={toRoute("/docs/ci")} />}>{t("navigation.ciIntegration")}</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={toRoute("/docs/contributing")} />}>{t("navigation.contributing")}</DropdownMenuItem>
          </HeaderDropdown>
          <HeaderDropdown immersive label={t("navigation.resources")}>
            <DropdownMenuItem render={<Link to={toRoute("/docs/installation")} />}>{t("navigation.documentation")}</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={toRoute("/docs/quick-start")} />}>{t("navigation.quickStart")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer" />}>{t("navigation.github")}</DropdownMenuItem>
          </HeaderDropdown>
          <Link className={`whitespace-nowrap px-3 py-2 text-sm transition-colors ${navText}`} to={toRoute("/docs/cli")}>{t("navigation.pricing")}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="max-[560px]:hidden"><LanguageSwitcher immersive /></div>
          <a className="hidden whitespace-nowrap text-sm text-white/65 transition-colors hover:text-white md:inline" href="mailto:hello@anatomy.dev">{t("navigation.contactSales")}</a>
          <Link className="hidden whitespace-nowrap text-sm text-white/65 transition-colors hover:text-white sm:inline" to={toRoute("/docs/installation")}>{t("navigation.signIn")}</Link>
          <Button nativeButton={false} render={<Link to={toRoute("/docs/installation")} />} size="sm" className="rounded-full border border-white/20 bg-white/[0.08] px-5 text-white backdrop-blur-md hover:bg-white/[0.16]">{t("navigation.startTrial")}</Button>
          <Button aria-label={mobileOpen ? "关闭导航" : "打开导航"} className="min-[900px]:hidden border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]" size="icon" variant="outline" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</Button>
        </div>
      </div>
      {mobileOpen && <nav className="border-t border-white/10 bg-[#0d0d18]/95 px-5 py-4 backdrop-blur-xl min-[900px]:hidden" aria-label="移动端主导航">
        <Link className="block py-3 text-sm text-white/75" to={toRoute("/docs/anatomy")} onClick={() => setMobileOpen(false)}>{t("navigation.features")}</Link>
        <Link className="block py-3 text-sm text-white/75" to={toRoute("/docs/ci")} onClick={() => setMobileOpen(false)}>{t("navigation.enterprise")}</Link>
        <Link className="block py-3 text-sm text-white/75" to={toRoute("/docs/installation")} onClick={() => setMobileOpen(false)}>{t("navigation.resources")}</Link>
        <Link className="block py-3 text-sm text-white/75" to={toRoute("/docs/cli")} onClick={() => setMobileOpen(false)}>{t("navigation.pricing")}</Link>
        <a className="block py-3 text-sm text-white/75" href="mailto:hello@anatomy.dev" onClick={() => setMobileOpen(false)}>{t("navigation.contactSales")}</a>
        <div className="mt-2"><LanguageSwitcher immersive /></div>
      </nav>}
    </header>;
  }

  return (
    <header className={headerClass}>
      <div className="mx-auto flex min-h-[70px] w-full max-w-7xl items-center gap-6 px-7 max-[560px]:px-[18px]">
        <Link className="shrink-0" to="/"><Brand immersive={immersive} /></Link>
        <div className={`flex h-[38px] w-[168px] items-center gap-2 rounded-lg border px-3 text-xs max-[560px]:size-10 max-[560px]:w-10 max-[560px]:px-3 ${immersive ? "border-white/15 bg-white/[0.04] text-white/60" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}>
          <Search size={16} /><span className="max-[560px]:hidden">{t("navigation.searchDocs")}</span><kbd className={`ml-auto rounded border px-1.5 py-0.5 font-mono text-[11px] max-[560px]:hidden ${immersive ? "border-white/15" : "border-[var(--border)]"}`}>⌘ K</kbd>
        </div>
        <nav className="ml-auto hidden items-center gap-0.5 min-[900px]:flex" aria-label="主导航">
          {navItems.map((item) => <Link key={item.href} className={`whitespace-nowrap px-3 py-2 text-[13px] transition-colors ${navText}`} to={toRoute(item.href)}>{t(`navigation.${item.key}`)}</Link>)}
          <HeaderDropdown immersive={immersive} label={t("navigation.resources")}>
            <DropdownMenuItem render={<Link to={toRoute("/docs/definition")} />}>{t("navigation.definitionSchema")}</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={toRoute("/docs/ci")} />}>{t("navigation.ciIntegration")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer" />}>{t("navigation.github")}</DropdownMenuItem>
          </HeaderDropdown>
          <HeaderDropdown immersive={immersive} label="v0.1.0">
            <DropdownMenuItem render={<Link to={toRoute("/")} />}>v0.1.0 · Current</DropdownMenuItem>
            <DropdownMenuItem render={<a href="https://github.com/forge-town/anatomy-cli/releases" target="_blank" rel="noreferrer" />}>Release notes ↗</DropdownMenuItem>
          </HeaderDropdown>
        </nav>
        <div className="ml-2 flex items-center gap-2.5">
          <a className={`hidden whitespace-nowrap text-[13px] transition-colors hover:text-white sm:inline ${immersive ? "text-white/65" : "text-[var(--muted-foreground)] hover:text-[var(--primary)]"}`} href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">{t("navigation.github")}</a>
          <div className="max-[560px]:hidden"><LanguageSwitcher immersive={immersive} /></div>
          <ThemeToggle immersive={immersive} />
          <Button aria-label={mobileOpen ? "关闭导航" : "打开导航"} className={`min-[900px]:hidden ${immersive ? "border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]" : ""}`} size="icon" variant="outline" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</Button>
        </div>
      </div>
      {mobileOpen && <nav className={`border-t px-5 py-3 min-[900px]:hidden ${immersive ? "border-white/10 bg-[#0d0b18]/90" : "border-[var(--border)]"}`} aria-label="移动端主导航">
        {navItems.map((item) => <Link key={item.href} className={`block py-3 text-sm ${immersive ? "text-white/70" : "text-[var(--muted-foreground)]"}`} to={toRoute(item.href)} onClick={() => setMobileOpen(false)}>{t(`navigation.${item.key}`)}</Link>)}
        <Link className={`block py-3 text-sm ${immersive ? "text-white/70" : "text-[var(--muted-foreground)]"}`} to={toRoute("/docs/definition")} onClick={() => setMobileOpen(false)}>{t("navigation.resources")}</Link>
        <div className="mt-2"><LanguageSwitcher immersive={immersive} /></div>
        <Badge className="mt-2">v0.1.0</Badge>
      </nav>}
    </header>
  );
};

export const PublicFooter = ({ mono = false }: { mono?: boolean }) => {
  const { t } = useTranslation();
  return <footer className={`mx-auto grid w-full max-w-7xl grid-cols-[2fr_1fr_1fr] gap-12 border-t-2 px-7 pb-[70px] pt-12 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1 max-[560px]:px-[18px] ${mono ? "border-[#26352e] text-[#26352e]/70" : "border-transparent text-[var(--muted-foreground)]"}`}>
    <div className="max-[900px]:col-span-2 max-[560px]:col-span-1"><Link to={toRoute("/")}><Brand mono={mono} /></Link><p className="mt-4 text-[13px]">{t("footer.tagline")}</p></div>
    <div><p className="font-mono text-[10px] tracking-[0.15em]">{t("footer.explore")}</p><Link className="mt-3 block text-[13px] hover:text-[#d9654b]" to={toRoute("/docs/installation")}>{t("footer.guide")}</Link><Link className="mt-3 block text-[13px] hover:text-[#d9654b]" to={toRoute("/docs/cli")}>{t("footer.config")}</Link><Link className="mt-3 block text-[13px] hover:text-[#d9654b]" to={toRoute("/docs/anatomy")}>{t("footer.concepts")}</Link></div>
    <div><p className="font-mono text-[10px] tracking-[0.15em]">{t("footer.resources")}</p><Link className="mt-3 block text-[13px] hover:text-[#d9654b]" to={toRoute("/docs/ci")}>{t("footer.ci")}</Link><Link className="mt-3 block text-[13px] hover:text-[#d9654b]" to={toRoute("/docs/contributing")}>{t("footer.contributing")}</Link><a className="mt-3 block text-[13px] hover:text-[#d9654b]" href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">{t("navigation.github")}</a></div>
  </footer>;
};

export const PublicLayout = ({ children, immersiveHeader = false, monoHeader = false }: { children: ReactNode; immersiveHeader?: boolean; monoHeader?: boolean }) => <div className={`min-h-screen ${monoHeader ? "bg-[#f2efe8] text-[#26352e]" : "bg-[var(--background)] text-[var(--foreground)]"}`}><PublicHeader immersive={immersiveHeader} mono={monoHeader} /><main>{children}</main><PublicFooter mono={monoHeader} /></div>;
