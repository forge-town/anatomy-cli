import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

const route = (href: string) => href as never;

const StartupLogo = () => <span className="inline-flex items-center text-sm font-semibold tracking-[0.12em] text-[var(--line-foreground)]">Anatomy CLI</span>;

export const StartupFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="overflow-hidden border-t border-[var(--line-border)] bg-[var(--line-background)] px-8 py-16 text-sm text-[var(--line-muted)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-12 md:flex-row md:px-8">
        <div className="w-full flex-1"><StartupLogo /><p className="mt-5 max-w-[260px] text-pretty leading-6">{t("startup.footerDescription")}</p><p className="mt-8 text-xs">{t("startup.copyright")}</p></div>
        <div className="grid w-full grid-cols-2 gap-10 md:w-[460px] md:grid-cols-3">
          <div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerPages")}</p><a className="block hover:text-[var(--line-foreground)]" href="#">{t("startup.home")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#scan">{t("startup.scanNav")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#features">{t("startup.capabilitiesNav")}</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#contact">{t("startup.contactNav")}</a></div>
          <div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerSocials")}</p><a className="block hover:text-[var(--line-foreground)]" href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer">GitHub</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#">X / Twitter</a><a className="mt-3 block hover:text-[var(--line-foreground)]" href="#">Discord</a></div>
          <div><p className="mb-4 font-semibold text-[var(--line-foreground)]">{t("startup.footerRegister")}</p><Link className="block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.signup")}</Link><Link className="mt-3 block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.login")}</Link><Link className="mt-3 block hover:text-[var(--line-foreground)]" to={route("/docs/installation")}>{t("startup.bookDemo")}</Link></div>
        </div>
      </div>
      <p aria-hidden="true" className="mt-16 whitespace-nowrap text-center text-5xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--line-border-strong)] sm:text-8xl md:text-[13rem]">ANATOMY CLI</p>
    </footer>
  );
};

StartupFooter.displayName = "StartupFooter";
