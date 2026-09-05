import { CheckCircle2, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CODE_PATH_LABELS, CODE_PATH_MAP, CodePathMapIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { TERMINAL_COMMAND } from "./terminalDemo";
import { useTerminalDemo } from "./useTerminalDemo";
import "./StartupTerminalCase.css";

export const StartupTerminalCase = () => {
  const { t } = useTranslation();
  const { ref, frame } = useTerminalDemo();

  return (
    <section
      aria-labelledby="terminal-case-title"
      className="w-full scroll-mt-14 bg-[var(--line-surface)] px-4 md:px-8"
      data-demo-phase={frame.phase}
      id="features"
      ref={ref}
    >
      <p className="sr-only">{t("startup.terminalCaseAccessibleResult")}</p>
      <div className="terminal-case__layout mx-auto min-w-0 max-w-7xl">
        <header className="col-span-full py-9 sm:py-11">
          <h2 id="terminal-case-title" className="font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">
            {t("startup.terminalCaseTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">
            {t("startup.terminalCaseDescription")}
          </p>
        </header>
        <article className="flex min-w-0 flex-col">
          <figure className="flex min-w-0 flex-1 flex-col border border-[var(--line-border)] bg-[var(--line-surface-raised)] md:border-b-0">
            <figcaption className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--line-border)] px-5 text-[var(--line-muted)] sm:px-8">
              <span className="inline-flex items-center gap-2.5 font-mono text-[11px]">
                <Terminal aria-hidden="true" className="size-3.5" />
                ~/project
              </span>
            </figcaption>

            <div aria-hidden="true" className="flex min-h-80 flex-1 flex-col justify-end gap-6 px-5 py-7 font-mono text-xs leading-6 sm:px-8 lg:text-sm">
              <div>
                <p className="whitespace-nowrap text-[var(--line-foreground)]">
                  <span className="mr-3 text-[var(--line-accent)]">$</span>
                  {frame.firstCommand}
                  {frame.phase === "typing" && <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-current" />}
                </p>
                <div className={cn("mt-3 transition-opacity duration-300 motion-reduce:transition-none", frame.showBlock ? "opacity-100" : "opacity-0")}>
                  <p className="text-[var(--line-muted)]">Anatomy check: <span className="text-[var(--line-accent)]">BLOCK</span></p>
                  <p className="text-[var(--line-muted)]">(1 block, 0 warn, 0 allow)</p>
                  <p className="mt-2 break-words text-[var(--line-accent)]">[BLOCK] legacy unexpected_entry:<br />Unexpected directory &quot;legacy&quot;</p>
                </div>
              </div>
              <div className={cn("transition-opacity duration-300 motion-reduce:transition-none", frame.showRecheck ? "opacity-100" : "opacity-0")}>
                <p className="whitespace-nowrap text-[var(--line-foreground)]">
                  <span className="mr-3 text-[var(--line-accent)]">$</span>
                  {frame.secondCommand}
                  {frame.phase === "rechecking" && <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-current" />}
                </p>
                <div className={cn("mt-3 transition-opacity duration-300 motion-reduce:transition-none", frame.showPass ? "opacity-100" : "opacity-0")}>
                  <p className="text-[var(--line-muted)]">Anatomy check: <span className="text-[var(--line-success)]">PASS</span></p>
                  <p className="text-[var(--line-muted)]">(0 block, 0 warn, 0 allow)</p>
                </div>
              </div>
            </div>

            <div aria-hidden="true" className="flex h-12 shrink-0 items-center justify-between border-t border-[var(--line-border)] px-5 font-mono text-[11px] text-[var(--line-muted)] sm:px-8">
              <span className={cn("inline-flex items-center gap-2", frame.showPass && "text-[var(--line-success)]", frame.showBlock && !frame.showPass && "text-[var(--line-accent)]")}>
                {frame.showPass ? <CheckCircle2 className="size-3.5" /> : <Terminal className="size-3.5" />}
                {frame.showPass ? "exit 0" : frame.showBlock ? "exit 1" : t("startup.terminalCaseReady")}
              </span>
              <span>{TERMINAL_COMMAND}</span>
            </div>
          </figure>
        </article>

        <figure aria-hidden="true" className="code-path-map">
          <div aria-hidden="true" className="code-path-map__canvas">
            <CodePathMapIcon className="block size-full" progress={frame.migrationProgress} />
            {CODE_PATH_LABELS.map(({ label, x, y, kind }) => (
              <span
                key={label}
                className={`code-path-map__label code-path-map__label--${kind}`}
                style={{ left: `${x / CODE_PATH_MAP.width * 100}%`, top: `${y / CODE_PATH_MAP.height * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
};

StartupTerminalCase.displayName = "StartupTerminalCase";
