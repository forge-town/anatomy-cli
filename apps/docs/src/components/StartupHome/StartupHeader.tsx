import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { applyTheme, getSavedTheme, saveTheme } from "@/lib/theme";

const route = (href: string) => href as never;

const StartupLogo = () => (
  <span className="inline-flex items-center text-sm font-semibold tracking-[0.12em] text-[var(--line-foreground)]">
    Anatomy
  </span>
);

export const StartupHeader = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const nextDark = getSavedTheme() === "dark";
    setDark(nextDark);
    applyTheme(nextDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    saveTheme(next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 bg-[color-mix(in_srgb,var(--line-background)_92%,transparent)] px-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4">
        <Link aria-label="Anatomy" className="shrink-0" to="/">
          <StartupLogo />
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <Button
            aria-label={dark ? t("startup.lightTheme") : t("startup.darkTheme")}
            className="size-9 rounded-md border-0 text-[var(--line-muted)] hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]"
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <LanguageSwitcher iconOnly startup />
          <Link
            className="text-sm font-semibold text-[var(--line-foreground)] hover:text-[var(--line-muted)]"
            to={route("/docs/installation")}
          >
            {t("startup.login")}
          </Link>
          <Button
            nativeButton={false}
            render={<Link to={route("/docs/installation")} />}
            size="sm"
            className="rounded-md border border-[var(--line-border-strong)] bg-transparent px-4 text-sm font-semibold text-[var(--line-foreground)] shadow-none hover:bg-[var(--line-hover)]"
          >
            {t("startup.headerCta")}
          </Button>
        </div>
        <Button
          aria-label={menuOpen ? t("startup.closeMenu") : t("startup.openMenu")}
          className="size-9 rounded-md border border-[var(--line-border)] bg-transparent text-[var(--line-foreground)] md:hidden"
          size="icon"
          variant="outline"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>
      {menuOpen && (
        <div className="mx-auto max-w-7xl border-x border-b border-[var(--line-border)] bg-[var(--line-background)] p-3 md:hidden">
          <a
            className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]"
            href="/#scan"
            onClick={() => setMenuOpen(false)}
          >
            {t("startup.scanNav")}
          </a>
          <a
            className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]"
            href="/#features"
            onClick={() => setMenuOpen(false)}
          >
            {t("startup.capabilitiesNav")}
          </a>
          <a
            className="block border-b border-[var(--line-border)] px-3 py-3 text-sm text-[var(--line-muted)] hover:text-[var(--line-foreground)]"
            href="/#contact"
            onClick={() => setMenuOpen(false)}
          >
            {t("startup.contactNav")}
          </a>
          <div className="px-3 py-2.5">
            <LanguageSwitcher startup />
          </div>
          <Link
            className="block px-3 py-2.5 text-sm font-semibold text-[var(--line-foreground)] hover:text-[var(--line-muted)]"
            to={route("/docs/installation")}
            onClick={() => setMenuOpen(false)}
          >
            {t("startup.login")}
          </Link>
          <Button
            nativeButton={false}
            render={<Link to={route("/docs/installation")} />}
            className="mt-2 w-full rounded-md border border-[var(--line-accent)] bg-[var(--line-accent)] text-[var(--line-background)] shadow-none hover:bg-[var(--line-foreground)] hover:text-[var(--line-background)]"
          >
            {t("startup.headerCta")}
          </Button>
        </div>
      )}
    </header>
  );
};

StartupHeader.displayName = "StartupHeader";
