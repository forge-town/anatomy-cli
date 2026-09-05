import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { StartupCiFileTree } from "./StartupCiFileTree";

const route = (href: string) => href as never;

export const StartupCiSection = () => {
  const { t } = useTranslation();

  return (
    <section className="w-full border-t border-[var(--line-border)] bg-[var(--line-surface)] px-4 py-20 md:px-8 md:py-24" id="ci">
      <div className="mx-auto grid min-w-0 max-w-7xl md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 pb-10 md:order-2 md:pb-0 md:pl-12">
          <h2 className="max-w-xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">
            {t("startup.ciTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">
            {t("startup.ciDescription")}
          </p>

          <ul className="mt-10 max-w-xl border-t border-[var(--line-border)] font-mono text-xs" aria-label={t("startup.ciExitCodesLabel")}>
            <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[var(--line-border)] py-3">
              <code className="text-[var(--line-success)]">0</code>
              <span className="text-[var(--line-muted)]">{t("startup.ciExitPass")}</span>
            </li>
            <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[var(--line-border)] py-3">
              <code className="text-[var(--line-accent)]">1</code>
              <span className="text-[var(--line-muted)]">{t("startup.ciExitBlocked")}</span>
            </li>
            <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[var(--line-border)] py-3">
              <code className="text-[var(--line-foreground)]">2</code>
              <span className="text-[var(--line-muted)]">{t("startup.ciExitError")}</span>
            </li>
          </ul>

          <Link
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--line-foreground)] underline decoration-[var(--line-border-strong)] underline-offset-4 transition-colors hover:text-[var(--line-accent)] focus-visible:outline-2 focus-visible:outline-offset-4"
            to={route("/docs/ci")}
          >
            {t("startup.ciDocsLink")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="flex min-w-0 self-stretch md:order-1">
          <StartupCiFileTree />
        </div>
      </div>
    </section>
  );
};

StartupCiSection.displayName = "StartupCiSection";
