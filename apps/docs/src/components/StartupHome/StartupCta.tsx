import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";

const route = (href: string) => href as never;

export const StartupCta = () => {
  const { i18n, t } = useTranslation();
  const ctaTitle = t("startup.ctaTitle");
  const language = i18n.resolvedLanguage ?? i18n.language ?? "zh";
  const ctaTitleContent = language.startsWith("zh") && typeof Intl.Segmenter !== "undefined"
    ? Array.from(new Intl.Segmenter("zh", { granularity: "word" }).segment(ctaTitle), ({ segment }) => segment)
        .reduce<string[]>((segments, segment) => {
          const previous = segments.at(-1);
          if (previous && /^[，。！？；：、]$/.test(segment)) {
            segments[segments.length - 1] = `${previous}${segment}`;
          } else {
            segments.push(segment);
          }
          return segments;
        }, [])
        .map((segment, index) => <span className="startup-cta__segment" key={`${segment}-${index}`}>{segment}</span>)
    : ctaTitle;

  return (
    <section id="contact" className="w-full border-t border-[var(--line-border)] bg-[var(--line-surface)] px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div><h2 className="startup-cta__title max-w-xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:max-w-2xl md:text-4xl">{ctaTitleContent}</h2><p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">{t("startup.ctaDescription")}</p></div>
        <Button nativeButton={false} render={<Link to={route("/docs/installation")} />} className="h-11 rounded-md border border-[var(--line-foreground)] bg-[var(--line-foreground)] px-5 text-sm font-semibold text-[var(--line-background)] shadow-none hover:bg-[var(--line-muted)]">{t("startup.ctaButton")}<ArrowRight size={15} /></Button>
      </div>
    </section>
  );
};

StartupCta.displayName = "StartupCta";
