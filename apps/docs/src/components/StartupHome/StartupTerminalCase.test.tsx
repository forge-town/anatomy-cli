import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/locales/en.json";
import zh from "@/locales/zh.json";
import { CODE_PATH_MAP, createCodePathDots, getCodePathPoint } from "@/components/icons";
import { StartupTerminalCase } from "./StartupTerminalCase";
import { getTerminalDemoFrame, TERMINAL_COMMAND, TERMINAL_DEMO_TIMING as timing } from "./terminalDemo";

const motionPreferences = vi.hoisted(() => ({ reducedMotion: true }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("motion/react", () => ({
  useInView: () => false,
  useReducedMotion: () => motionPreferences.reducedMotion,
}));

afterEach(() => { motionPreferences.reducedMotion = true; });

describe("terminal and open code path map", () => {
  it("complements one terminal with a borderless route illustration", () => {
    const html = renderToStaticMarkup(createElement(StartupTerminalCase));
    expect(html.match(/<article\b/g)).toHaveLength(1);
    expect(html.match(/<figure\b/g)).toHaveLength(2);
    expect(html).toContain("startup.terminalCaseTitle");
    expect(html).not.toContain("startup.terminalCaseFixTitle");
    expect(html).not.toContain("Button.tsx");
    expect(html).toContain("src/legacy/");
    expect(html).toContain("src/components/ui/");
    expect(html).not.toContain("<ol");
    expect(html).not.toContain("pnpm dlx");
    expect(html).toContain('class="code-path-map"');
    expect(html).not.toContain("<button");
  });

  it("uses section spacing and top-aligned terminal content", () => {
    const html = renderToStaticMarkup(createElement(StartupTerminalCase));
    const sectionClass = html.match(/<section[^>]*class="([^"]*)"/)?.[1];
    expect(sectionClass).toBeDefined();
    expect(sectionClass).toContain("md:py-24");
    expect(html).toContain("terminal-case__layout");
    expect(html).not.toContain("md:grid-cols-2");
    expect(html).not.toContain("grid-rows-subgrid");
    expect(html).toContain("flex-col justify-start");
  });

  it("shows the complete example without animation for reduced motion", () => {
    const html = renderToStaticMarkup(createElement(StartupTerminalCase));
    expect(html).toContain('data-demo-phase="passed"');
    expect(html).toContain('<p class="sr-only">startup.terminalCaseAccessibleResult</p>');
    expect(html).not.toContain("startup.terminalCaseManualChange");
    expect(html).not.toContain("startup.terminalCaseVerified");
    expect(html).toContain("exit 0");
    expect(html).toContain("(1 block, 0 warn, 0 allow)");
    expect(html).toContain("(0 block, 0 warn, 0 allow)");
    expect(html).not.toContain('aria-live="polite"');
    expect(html).not.toContain("startup.terminalCasePause");
    expect(html).toContain("motion-reduce:transition-none");
  });

  it("also omits playback controls when motion is enabled", () => {
    motionPreferences.reducedMotion = false;
    const html = renderToStaticMarkup(createElement(StartupTerminalCase));
    expect(html).toContain('data-demo-phase="typing"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("terminalCasePause");
    expect(html).not.toContain("terminalCaseReplay");
  });

  it("types both actual commands before revealing their results", () => {
    expect(getTerminalDemoFrame(0).firstCommand).toBe("");
    expect(getTerminalDemoFrame(timing.typeStart + timing.character).firstCommand).toBe("a");
    expect(getTerminalDemoFrame(timing.block - 1).firstCommand).toBe(TERMINAL_COMMAND);
    expect(getTerminalDemoFrame(timing.block - 1).showBlock).toBe(false);
    expect(getTerminalDemoFrame(timing.block).showBlock).toBe(true);
    expect(getTerminalDemoFrame(timing.recheck).secondCommand).toBe("");
    expect(getTerminalDemoFrame(timing.pass - 1).secondCommand).toBe(TERMINAL_COMMAND);
    expect(getTerminalDemoFrame(timing.pass - 1).showPass).toBe(false);
    expect(getTerminalDemoFrame(timing.pass).showPass).toBe(true);
  });

  it("does not mark the fix verified until the second command has run", () => {
    const blocked = getTerminalDemoFrame(timing.block);
    expect(blocked).toMatchObject({ phase: "blocked", isFixed: false, showRecheck: false, showPass: false });
    const fixed = getTerminalDemoFrame(timing.fix);
    expect(fixed).toMatchObject({ phase: "fixed", isFixed: true, showRecheck: false, showPass: false });
    expect(getTerminalDemoFrame(timing.recheck)).toMatchObject({ phase: "rechecking", showPass: false });
    expect(getTerminalDemoFrame(timing.end)).toMatchObject({ phase: "passed", isFixed: true, showPass: true });
    expect(timing.fix - timing.block).toBeGreaterThan(1000);
    expect(timing.fix + timing.migration).toBeLessThan(timing.recheck);
    expect(timing.pass + 300).toBeLessThan(timing.end);
    expect(timing.end).toBeLessThan(5000);
    expect(getTerminalDemoFrame(timing.fix).migrationProgress).toBe(0);
    expect(getTerminalDemoFrame(timing.fix + timing.migration).migrationProgress).toBe(1);
  });

  it("generates stable dotted regions and a curve matching both directory nodes", () => {
    const dots = createCodePathDots();
    expect(dots).toEqual(createCodePathDots());
    expect(dots.length).toBeGreaterThan(800);
    expect(dots.length).toBeLessThan(1500);
    expect(dots.every(({ x, y, opacity }) => x > 0 && x < CODE_PATH_MAP.width && y > 0 && y < CODE_PATH_MAP.height && opacity > 0 && opacity <= 0.5)).toBe(true);
    expect(getCodePathPoint(0)).toEqual(CODE_PATH_MAP.start);
    expect(getCodePathPoint(1)).toEqual(CODE_PATH_MAP.end);
    expect(getCodePathPoint(-1)).toEqual(CODE_PATH_MAP.start);
    expect(getCodePathPoint(2)).toEqual(CODE_PATH_MAP.end);
    expect(getCodePathPoint(0.5).y).toBeLessThan(CODE_PATH_MAP.end.y);
  });

  it("keeps new copy mirrored in both languages and removes the rejected checklist", () => {
    const keys = (locale: typeof en) => Object.keys(locale.startup).filter((key) => key.startsWith("terminalCase")).sort();
    expect(keys(en)).toEqual(keys(zh));
    expect(keys(en)).not.toContain("terminalCaseFixTitle");
    expect(keys(en)).toContain("terminalCaseAccessibleResult");
    expect(keys(en)).not.toContain("terminalCaseInstallTitle");
    expect(keys(en)).not.toContain("terminalCaseDefinitionTitle");
    expect(keys(en)).not.toContain("terminalCasePause");
    expect(keys(en)).not.toContain("terminalCaseResume");
    expect(keys(en)).not.toContain("terminalCaseReplay");
  });
});
