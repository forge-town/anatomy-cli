import { AlertCircle, ArrowRight, CheckCircle2, FileCode2 } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const CapabilityCard = ({ index, title, copy, children }: { index: number; title: string; copy: string; children: ReactNode }) => (
  <article className={cn("min-w-0 border-t border-[var(--line-border)] pt-5", index === 1 ? "md:pr-6" : "md:border-l md:pl-6 md:pr-6")}>
    <div className="flex items-baseline gap-4"><span className="shrink-0 font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--line-accent)]">0{index}</span><h3 className="min-w-0 text-left text-lg font-semibold tracking-[-0.02em] text-[var(--line-foreground)]">{title}</h3></div>
    <p className="mt-3 min-h-0 max-w-sm text-pretty text-sm leading-6 text-[var(--line-muted)] md:min-h-[4.5rem]">{copy}</p>
    <div className="mt-8 min-w-0">{children}</div>
  </article>
);

export const StartupFeatures = () => {
  const { t } = useTranslation();
  return (
    <section id="features" className="w-full border-t border-[var(--line-border)] bg-[var(--line-background)] px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl"><h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">{t("startup.featuresTitle")}</h2><p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">{t("startup.featuresDescription")}</p></div>
        <div className="mt-14 grid min-w-0 items-stretch gap-10 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-0">
          <CapabilityCard index={1} title={t("startup.oneClickTitle")} copy={t("startup.oneClickCopy")}><div className="font-mono text-xs text-[var(--line-foreground)]"><div className="flex items-center gap-3 border-y border-[var(--line-border)] py-3"><span className="text-[var(--line-muted)]">01</span><code>anatomy.json</code><CheckCircle2 className="ml-auto size-4 text-[var(--line-success)]" /></div><div className="flex items-center gap-3 border-b border-[var(--line-border)] py-3"><span className="text-[var(--line-muted)]">02</span><code>anatomy check ./src</code><ArrowRight className="ml-auto size-4 text-[var(--line-accent)]" /></div></div></CapabilityCard>
          <CapabilityCard index={2} title={t("startup.workflowTitle")} copy={t("startup.workflowCopy")}><div className="border-y border-[var(--line-border)] py-4 font-mono text-[11px] leading-5 text-[var(--line-muted)]"><div className="mb-3 flex items-center gap-2 text-[var(--line-foreground)]"><FileCode2 className="size-4 text-[var(--line-accent)]" /> anatomy.json</div><pre className="overflow-x-auto whitespace-pre">{`{\n  "root": {\n    "children": [...]\n  }\n}`}</pre></div></CapabilityCard>
          <CapabilityCard index={3} title={t("startup.edgeTitle")} copy={t("startup.edgeCopy")}><div className="font-mono text-xs text-[var(--line-foreground)]"><div className="flex items-center gap-2 border-y border-[var(--line-border)] py-3 text-[var(--line-success)]"><CheckCircle2 className="size-4" /> 4 {t("startup.previewMatches")}</div><div className="flex items-center gap-2 border-b border-[var(--line-border)] py-3 text-[var(--line-accent)]"><AlertCircle className="size-4" /> 1 {t("startup.previewWarnings")}</div><div className="border-b border-[var(--line-border)] py-3 text-[var(--line-muted)]">local · pull request · CI</div></div></CapabilityCard>
        </div>
      </div>
    </section>
  );
};

StartupFeatures.displayName = "StartupFeatures";
