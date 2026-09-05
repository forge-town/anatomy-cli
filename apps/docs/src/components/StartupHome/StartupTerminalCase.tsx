import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const TERMINAL_COMMAND = "anatomy ./src";
const TYPE_DELAY_MS = 56;
const INITIAL_PAUSE_MS = 560;
const SUMMARY_PAUSE_MS = 440;
const FINDING_PAUSE_MS = 520;
const FOOTER_PAUSE_MS = 440;
const RESULT_HOLD_MS = 3_200;

type TerminalFrame = {
  commandLength: number;
  outputStage: number;
};

const finalFrame: TerminalFrame = {
  commandLength: TERMINAL_COMMAND.length,
  outputStage: 3,
};

export const StartupTerminalCase = () => {
  const { t } = useTranslation();
  const terminalRef = useRef<HTMLElement>(null);
  const isInView = useInView(terminalRef, { amount: 0.4, once: true });
  const shouldReduceMotion = useReducedMotion();
  const [frame, setFrame] = useState<TerminalFrame>({
    commandLength: 0,
    outputStage: 0,
  });

  useEffect(() => {
    if (!isInView) return;

    if (shouldReduceMotion) {
      setFrame(finalFrame);
      return;
    }

    const timers = new Set<number>();
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);

      timers.add(timer);
    };

    const runCycle = () => {
      let commandLength = 0;
      setFrame({ commandLength: 0, outputStage: 0 });

      const typeNextCharacter = () => {
        commandLength += 1;
        setFrame({ commandLength, outputStage: 0 });

        if (commandLength < TERMINAL_COMMAND.length) {
          schedule(typeNextCharacter, TYPE_DELAY_MS);
          return;
        }

        schedule(() => {
          setFrame({ commandLength: TERMINAL_COMMAND.length, outputStage: 1 });
          schedule(() => {
            setFrame({
              commandLength: TERMINAL_COMMAND.length,
              outputStage: 2,
            });
            schedule(() => {
              setFrame(finalFrame);
              schedule(runCycle, RESULT_HOLD_MS);
            }, FOOTER_PAUSE_MS);
          }, FINDING_PAUSE_MS);
        }, SUMMARY_PAUSE_MS);
      };

      schedule(typeNextCharacter, INITIAL_PAUSE_MS);
    };

    runCycle();

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [isInView, shouldReduceMotion]);

  const command = TERMINAL_COMMAND.slice(0, frame.commandLength);
  const isTyping = frame.commandLength < TERMINAL_COMMAND.length;

  return (
    <section
      className="w-full border-t border-[var(--line-border)] bg-[var(--line-surface)] px-4 py-20 md:px-8 md:py-24"
      id="features"
    >
      <div className="mx-auto grid min-w-0 max-w-7xl border-y border-[var(--line-border)] md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <figure
          aria-label={`${t("startup.terminalCaseWindowLabel")}: ${TERMINAL_COMMAND}`}
          className="flex min-w-0 flex-col bg-[var(--line-surface-raised)]"
          ref={terminalRef}
        >
          <figcaption className="flex min-h-12 items-center justify-between gap-4 border-b border-[var(--line-border)] px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--line-muted)] md:px-7">
            <span>{t("startup.terminalCaseWindowLabel")}</span>
            <span>anatomy ./src</span>
          </figcaption>

          <div
            aria-hidden="true"
            className="flex min-h-[24rem] flex-1 flex-col justify-center overflow-hidden px-5 py-12 font-mono text-xs leading-7 sm:text-sm md:px-7"
          >
            <p className="min-h-7 whitespace-nowrap text-[var(--line-foreground)]">
              <span className="mr-3 text-[var(--line-accent)]">$</span>
              {command}
              <span
                className={`ml-0.5 inline-block h-[1.05em] w-px translate-y-[0.18em] bg-[var(--line-foreground)] transition-opacity duration-150 ${isTyping ? "opacity-80" : "opacity-0"}`}
              />
            </p>

            <p
              className={`mt-7 min-h-7 whitespace-nowrap text-[var(--line-muted)] transition-[opacity,transform] duration-300 ease-out ${frame.outputStage >= 1 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
            >
              Anatomy check:{" "}
              <span className="text-[var(--line-accent)]">BLOCK</span> (1 block,
              0 warn, 6 allow)
            </p>

            <p
              className={`mt-7 min-h-7 max-w-xl border-l-2 border-[var(--line-accent)] pl-4 text-[var(--line-accent)] transition-[opacity,transform] duration-300 ease-out ${frame.outputStage >= 2 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
            >
              [BLOCK] legacy unexpected_entry: Unexpected directory
              &quot;legacy&quot;
            </p>
          </div>

          <div
            aria-hidden="true"
            className={`grid gap-3 border-t border-[var(--line-border)] px-5 py-4 font-mono text-xs transition-opacity duration-300 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6 md:px-7 ${frame.outputStage >= 3 ? "opacity-100" : "opacity-0"}`}
          >
            <span className="inline-flex items-center gap-2 text-[var(--line-accent)]">
              <AlertCircle className="size-3.5" />
              exit 1
            </span>
            <span className="inline-flex min-w-0 items-center gap-2 text-[var(--line-muted)] sm:justify-self-end">
              <CheckCircle2 className="size-3.5 shrink-0 text-[var(--line-success)]" />
              {t("startup.terminalCaseNextStep")}
            </span>
          </div>
        </figure>

        <div className="min-w-0 border-t border-[var(--line-border)] py-10 pl-0 md:border-l md:border-t-0 md:py-14 md:pl-12">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--line-accent)]">
            {t("startup.terminalCaseEyebrow")}
          </p>
          <h2 className="mt-5 max-w-xl text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--line-foreground)] md:text-4xl">
            {t("startup.terminalCaseTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--line-muted)]">
            {t("startup.terminalCaseDescription")}
          </p>

          <dl className="mt-10 max-w-xl border-t border-[var(--line-border)] font-mono text-xs">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-[var(--line-border)] py-3">
              <dt className="text-[var(--line-muted)]">
                {t("startup.terminalCaseRuleLabel")}
              </dt>
              <dd className="text-[var(--line-foreground)]">
                {t("startup.terminalCaseRule")}
              </dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-[var(--line-border)] py-3">
              <dt className="text-[var(--line-muted)]">
                {t("startup.terminalCaseTargetLabel")}
              </dt>
              <dd>
                <code className="text-[var(--line-foreground)]">./src</code>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

StartupTerminalCase.displayName = "StartupTerminalCase";
