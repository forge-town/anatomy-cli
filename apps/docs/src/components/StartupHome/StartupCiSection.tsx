import { ArrowRight, Boxes, CircleDot, GitBranch, Workflow } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const route = (href: string) => href as never;

export const StartupCiSection = () => {
  const { t } = useTranslation();

  return (
    <section className="w-full border-t border-[var(--line-border)] bg-[var(--line-surface)] px-4 py-20 md:px-8 md:py-24" id="ci">
      <div className="mx-auto grid min-w-0 max-w-7xl border-y border-[var(--line-border)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 py-10 pr-0 md:py-14 md:pr-12">
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

        <div className="min-w-0 border-t border-[var(--line-border)] py-10 md:border-t-0 md:border-l md:py-14 md:pl-12">
          <div className="flex items-center justify-between border-b border-[var(--line-border)] pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--line-muted)]">
            <span>CI / CD</span>
            <span>Anatomy CLI</span>
          </div>
          <div className="grid min-h-72 grid-cols-2 border-b border-[var(--line-border)]">
            <div className="flex min-h-36 flex-col justify-between border-r border-b border-[var(--line-border)] p-5 sm:p-6">
              <Workflow aria-hidden="true" className="size-7 text-[var(--line-accent)]" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-[var(--line-foreground)]">GitHub Actions</span>
            </div>
            <div className="flex min-h-36 flex-col justify-between border-b border-[var(--line-border)] p-5 sm:p-6">
              <GitBranch aria-hidden="true" className="size-7 text-[var(--line-accent)]" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-[var(--line-foreground)]">GitLab CI</span>
            </div>
            <div className="flex min-h-36 flex-col justify-between border-r border-[var(--line-border)] p-5 sm:p-6">
              <CircleDot aria-hidden="true" className="size-7 text-[var(--line-accent)]" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-[var(--line-foreground)]">CircleCI</span>
            </div>
            <div className="flex min-h-36 flex-col justify-between p-5 sm:p-6">
              <Boxes aria-hidden="true" className="size-7 text-[var(--line-accent)]" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-[var(--line-foreground)]">Jenkins</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

StartupCiSection.displayName = "StartupCiSection";
