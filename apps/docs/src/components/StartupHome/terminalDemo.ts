export const TERMINAL_COMMAND = "anatomy ./src";

export const TERMINAL_DEMO_TIMING = {
  typeStart: 200,
  character: 56,
  block: 1_100,
  fix: 2_300,
  migration: 700,
  recheck: 3_100,
  pass: 4_100,
  end: 4_600,
} as const;

const typedCommand = (elapsed: number, start: number) =>
  TERMINAL_COMMAND.slice(0, Math.max(0, Math.floor((elapsed - start) / TERMINAL_DEMO_TIMING.character)));

export const getTerminalDemoFrame = (elapsed: number) => ({
  phase: elapsed >= TERMINAL_DEMO_TIMING.pass ? "passed"
    : elapsed >= TERMINAL_DEMO_TIMING.recheck ? "rechecking"
    : elapsed >= TERMINAL_DEMO_TIMING.fix ? "fixed"
    : elapsed >= TERMINAL_DEMO_TIMING.block ? "blocked" : "typing",
  firstCommand: typedCommand(elapsed, TERMINAL_DEMO_TIMING.typeStart),
  secondCommand: typedCommand(elapsed, TERMINAL_DEMO_TIMING.recheck),
  showBlock: elapsed >= TERMINAL_DEMO_TIMING.block,
  isFixed: elapsed >= TERMINAL_DEMO_TIMING.fix,
  showRecheck: elapsed >= TERMINAL_DEMO_TIMING.recheck,
  showPass: elapsed >= TERMINAL_DEMO_TIMING.pass,
  migrationProgress: Math.min(1, Math.max(0, (elapsed - TERMINAL_DEMO_TIMING.fix) / TERMINAL_DEMO_TIMING.migration)),
});
