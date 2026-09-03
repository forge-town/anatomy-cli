import { ArrowLeft, ArrowRight, Clipboard, ExternalLink } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublicLayout } from "@/components/PublicLayout";
import { docsEntries, getDocsEntry } from "@/content";

const groups = ["Guide", "Reference", "Concepts", "Development"] as const;
const toRoute = (href: string) => href as never;

export const DocsPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const entry = getDocsEntry(slug ?? "installation") ?? docsEntries[0]!;
  const index = docsEntries.findIndex((item) => item.slug === entry.slug);
  const previous = docsEntries[index - 1];
  const next = docsEntries[index + 1];
  const localized = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const localizedList = (key: string, fallback: string[]) => {
    const value = t(key, { defaultValue: fallback, returnObjects: true });
    return Array.isArray(value) ? (value as string[]) : fallback;
  };
  const title = localized(`docs.${entry.slug}.title`, entry.title);
  const summary = localized(`docs.${entry.slug}.summary`, entry.summary);
  return (
    <PublicLayout>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[200px_minmax(0,1fr)_160px] gap-14 px-7 pb-[100px] pt-[70px] max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[560px]:px-[18px]">
        <aside className="sticky top-[100px] self-start max-[900px]:static">
          <Link
            className="mb-6 inline-flex items-center gap-2 text-[13px] text-[var(--primary)]"
            to="/"
          >
            <ArrowLeft size={15} /> {t("docsPage.backHome")}
          </Link>
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-1 mt-[18px] font-mono text-[10px] tracking-[0.14em] text-[var(--muted-foreground)]">
                {t(`docs.sections.${group.toLowerCase()}`).toUpperCase()}
              </p>
              {docsEntries
                .filter((item) => item.section === group)
                .map((item) => (
                  <Link
                    key={item.slug}
                    className={`block border-l-2 px-2.5 py-2 text-[13px] ${item.slug === entry.slug ? "border-[var(--primary)] bg-[var(--muted)] text-[var(--foreground)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
                    to={toRoute(`/docs/${item.slug}`)}
                  >
                    {localized(`docs.${item.slug}.title`, item.title)}
                  </Link>
                ))}
            </div>
          ))}
        </aside>
        <article className="min-w-0 max-w-[760px]">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted-foreground)]">
            <Badge>{t(`docs.sections.${entry.section.toLowerCase()}`)}</Badge>
            <span>/</span>
            <span>{entry.slug}</span>
          </div>
          <h1 className="mb-3 mt-5 text-[clamp(38px,5vw,58px)] font-semibold leading-[1.04] tracking-[-0.06em]">
            {title}
          </h1>
          <p className="mb-11 text-lg leading-[1.65] text-[var(--muted-foreground)]">{summary}</p>
          <div className="grid gap-6">
            {entry.blocks.map((block, blockIndex) =>
              block.type === "heading" ? (
                <h2 className="mt-5 text-[25px] tracking-[-0.04em]" key={blockIndex}>
                  {localized(`docs.${entry.slug}.blocks.${blockIndex}`, block.text)}
                </h2>
              ) : block.type === "paragraph" ? (
                <p
                  className="text-[15px] leading-[1.8] text-[var(--card-foreground)]"
                  key={blockIndex}
                >
                  {localized(`docs.${entry.slug}.blocks.${blockIndex}`, block.text)}
                </p>
              ) : block.type === "list" ? (
                <ul
                  className="grid gap-2 pl-6 text-[15px] leading-[1.8] text-[var(--card-foreground)]"
                  key={blockIndex}
                >
                  {localizedList(`docs.${entry.slug}.blocks.${blockIndex}`, block.items).map(
                    (item) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
                </ul>
              ) : (
                <Card className="overflow-hidden" key={blockIndex}>
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 font-mono text-[10px] uppercase text-[var(--muted-foreground)]">
                    <span>{block.language}</span>
                    <Button aria-label={t("docsPage.copyCode")} size="icon" variant="ghost">
                      <Clipboard size={14} />
                    </Button>
                  </div>
                  <pre className="m-0 overflow-x-auto bg-[var(--background)] p-5 font-mono text-[13px] leading-[1.7] text-[var(--card-foreground)]">
                    <code>{block.code}</code>
                  </pre>
                </Card>
              ),
            )}
          </div>
          <div className="mt-[70px] flex justify-between gap-5 border-t border-[var(--border)] pt-6">
            {previous ? (
              <Link
                className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]"
                to={toRoute(`/docs/${previous.slug}`)}
              >
                <ArrowLeft size={15} />
                <span>
                  {t("docsPage.previous")}
                  <strong className="mt-1 block text-sm text-[var(--foreground)]">
                    {localized(`docs.${previous.slug}.title`, previous.title)}
                  </strong>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]"
                to={toRoute(`/docs/${next.slug}`)}
              >
                <span className="text-right">
                  {t("docsPage.next")}
                  <strong className="mt-1 block text-sm text-[var(--foreground)]">
                    {localized(`docs.${next.slug}.title`, next.title)}
                  </strong>
                </span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </article>
        <aside className="sticky top-[100px] grid self-start gap-3 max-[900px]:static">
          <p className="m-0 font-mono text-[10px] tracking-[0.14em] text-[var(--muted-foreground)]">
            {t("docsPage.onThisPage")}
          </p>
          <a
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]"
            href="#"
          >
            {title}
          </a>
          <a
            className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]"
            href="https://github.com/forge-town/anatomy-cli"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ExternalLink size={12} />
          </a>
        </aside>
      </div>
    </PublicLayout>
  );
};
