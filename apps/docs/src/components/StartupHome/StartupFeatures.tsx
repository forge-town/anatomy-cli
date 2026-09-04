import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type CapabilityCardProps = {
  index: number;
  title: string;
  copy: string;
  children: ReactNode;
};

const CapabilityCard = ({ index, title, copy, children }: CapabilityCardProps) => (
  <article className={cn("group min-w-0", index > 1 && "md:pl-8")}>
    <div className="relative z-10 flex items-center gap-3 md:mb-8 md:block">
      <span className="startup-feature-flow__node inline-flex shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold tracking-[0.16em]">
        0{index}
      </span>
    </div>
    <div className="mt-5 md:mt-0">
      <h3 className="max-w-xs text-left text-lg font-semibold tracking-[-0.02em] text-[var(--line-foreground)]">{title}</h3>
      <p className="mt-3 min-h-0 max-w-sm text-pretty text-sm leading-6 text-[var(--line-muted)] md:min-h-[4.5rem]">{copy}</p>
      <div className="mt-8 min-w-0">{children}</div>
    </div>
  </article>
);

export const StartupFeatures = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="w-full border-t border-[var(--line-border)] bg-[var(--line-background)] px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-[var(--line-border)] pb-8">
          <div className="max-w-2xl">
            <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">{t("startup.featuresTitle")}</h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">{t("startup.featuresDescription")}</p>
          </div>
        </div>

        <div className="startup-feature-flow relative mt-12 md:mt-16">
          <div aria-hidden="true" className="startup-feature-flow__track" />
          <div className="grid min-w-0 gap-12 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-0">
            <CapabilityCard index={1} title={t("startup.localDefineTitle")} copy={t("startup.localDefineCopy")}>
              <div className="font-mono text-xs text-[var(--line-muted)]">
                <div className="border-y border-[var(--line-border)] py-3">
                  <code>{`{ "root": {`}</code>
                </div>
                <div className="border-b border-[var(--line-border)] py-3">
                  <code>{`  "children": [...] } }`}</code>
                </div>
              </div>
            </CapabilityCard>

            <CapabilityCard index={2} title={t("startup.localCheckTitle")} copy={t("startup.localCheckCopy")}>
              <div className="font-mono text-xs text-[var(--line-foreground)]">
                <div className="flex items-center gap-3 border-y border-[var(--line-border)] py-3">
                  <span className="text-[var(--line-muted)]">$</span>
                  <code>anatomy check ./src</code>
                  <ArrowRight className="ml-auto size-4 text-[var(--line-accent)]" />
                </div>
                <div className="flex items-center gap-3 border-b border-[var(--line-border)] py-3">
                  <span className="text-[var(--line-muted)]">✓</span>
                  <code>{t("startup.localCheckComplete")}</code>
                  <CheckCircle2 className="ml-auto size-4 text-[var(--line-success)]" />
                </div>
              </div>
            </CapabilityCard>

            <CapabilityCard index={3} title={t("startup.localResultTitle")} copy={t("startup.localResultCopy")}>
              <div className="font-mono text-xs text-[var(--line-foreground)]">
                <div className="flex items-center gap-2 border-y border-[var(--line-border)] py-3 text-[var(--line-success)]">
                  <CheckCircle2 className="size-4" /> 4 {t("startup.previewMatches")}
                </div>
                <div className="flex items-center gap-2 border-b border-[var(--line-border)] py-3 text-[var(--line-accent)]">
                  <AlertCircle className="size-4" /> 1 {t("startup.previewWarnings")}
                </div>
              </div>
            </CapabilityCard>
          </div>
        </div>
      </div>
    </section>
  );
};

StartupFeatures.displayName = "StartupFeatures";
