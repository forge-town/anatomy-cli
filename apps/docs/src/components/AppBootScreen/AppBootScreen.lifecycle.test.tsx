import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppBootScreen } from "./AppBootScreen";

// Exercise the boot lifecycle without adding a DOM/Storybook runtime to docs.
// Geometry and actual SVG rendering are checked separately in the browser.
const hooks = vi.hoisted(() => ({
  effect: undefined as (() => (() => void) | undefined) | undefined,
  screen: undefined as unknown,
  setters: [] as ReturnType<typeof vi.fn>[],
  language: vi.fn(),
  theme: vi.fn(),
}));

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => (() => void) | undefined) => { hooks.effect = effect; },
  useRef: () => ({ current: hooks.screen }),
  useState: (initial: unknown) => {
    const setter = vi.fn();
    hooks.setters.push(setter);
    return [typeof initial === "function" ? initial() : initial, setter];
  },
}));
vi.mock("@/lib/i18n", () => ({ applySavedLanguage: hooks.language }));
vi.mock("@/lib/theme", () => ({ applyTheme: hooks.theme, getSavedTheme: () => "dark" }));

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
};

const setup = (reducedMotion = false, fontsReady: Promise<void> = Promise.resolve()) => {
  const animations: { finished: Promise<void>; resolve: () => void; cancel: ReturnType<typeof vi.fn> }[] = [];
  const animate = vi.fn(() => {
    const { promise, resolve } = deferred();
    const animation = { currentTime: 0, finished: promise, resolve, cancel: vi.fn() };
    animations.push(animation);
    return animation;
  });
  const screen = {
    dataset: { phase: "loading" }, animate,
    querySelector: () => ({ animate }),
    querySelectorAll: () => [{ animate }, { animate }, { animate }],
    getBoundingClientRect: () => ({ width: 1440, height: 900 }),
  };
  const root = { dataset: {} as Record<string, string>, lang: "zh-CN" };
  const content = { inert: false };
  const preference = { matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("document", { documentElement: root, fonts: { ready: fontsReady }, querySelector: () => content });
  vi.stubGlobal("window", {
    setTimeout, clearTimeout, innerWidth: 1440, innerHeight: 900,
    requestAnimationFrame: (callback: () => void) => setTimeout(callback, 0),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), matchMedia: () => preference,
  });
  hooks.screen = screen;
  hooks.language.mockResolvedValue("en");
  hooks.theme.mockImplementation((theme) => { root.dataset.theme = theme; });
  AppBootScreen();
  const cleanup = hooks.effect!()!;
  return { root, content, screen, animations, preference, animate, cleanup };
};

describe("AppBootScreen readiness lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hooks.setters = [];
    hooks.language.mockReset();
    hooks.theme.mockReset();
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("applies saved preferences before revealing, and unlocks only after the panels finish", async () => {
    const fonts = deferred();
    const app = setup(false, fonts.promise);
    expect(app.content.inert).toBe(true);
    await vi.advanceTimersByTimeAsync(700);
    expect(app.root.lang).toBe("en");
    expect(app.root.dataset.theme).toBe("dark");
    expect(app.screen.dataset.phase).toBe("loading");
    fonts.resolve();
    await vi.advanceTimersByTimeAsync(5);
    expect(app.screen.dataset.phase).toBe("rays");
    expect(app.root.dataset.appRevealing).toBeUndefined();
    app.animations.slice(1, 4).forEach((animation) => animation.resolve());
    await vi.advanceTimersByTimeAsync(100);
    expect(app.screen.dataset.phase).toBe("opening");
    expect(app.root.dataset.appRevealing).toBe("true");
    expect(app.root.dataset.appReady).toBeUndefined();
    expect(app.content.inert).toBe(true);
    app.animations[4]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(app.screen.dataset.phase).toBe("complete");
    expect(app.root.dataset.appReady).toBe("true");
    expect(app.root.dataset.appRevealing).toBeUndefined();
    expect(app.content.inert).toBe(false);
    expect(hooks.setters[0]).toHaveBeenCalledWith(true);
    app.cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("skips all movement and the artificial hold for reduced motion", async () => {
    const app = setup(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(app.animate).not.toHaveBeenCalled();
    expect(app.root.dataset.appReady).toBe("true");
    expect(app.root.lang).toBe("en");
    expect(app.content.inert).toBe(false);
    app.cleanup();
  });

  it("releases locks and cancels animations when unmounted while waiting", async () => {
    const fonts = deferred();
    const app = setup(false, fonts.promise);
    await vi.advanceTimersByTimeAsync(20);
    app.cleanup();
    fonts.resolve();
    await vi.advanceTimersByTimeAsync(1000);
    expect(app.content.inert).toBe(false);
    expect(app.root.dataset.appReady).toBe("true");
    expect(app.animations[0]!.cancel).toHaveBeenCalled();
    expect(hooks.setters[0]).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
