import { afterEach, describe, expect, it, vi } from "vitest";
import { createBootGeometry, getOpeningScale, TRIANGLE_VERTICES, type Point } from "./boot-geometry";
import { BOOT_MOTION, createBootMotion, getTurnSettleMs, waitForBoot } from "./boot-motion";

const contains = (polygon: Point[], point: Point) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

describe("boot aperture geometry", () => {
  it("is an inverted equilateral triangle centered on its centroid", () => {
    expect(TRIANGLE_VERTICES.reduce((sum, p) => sum + p.x, 0)).toBeCloseTo(0);
    expect(TRIANGLE_VERTICES.reduce((sum, p) => sum + p.y, 0)).toBeCloseTo(0);
    const lengths = TRIANGLE_VERTICES.map((p, i) => {
      const next = TRIANGLE_VERTICES[(i + 1) % 3]!;
      return Math.hypot(p.x - next.x, p.y - next.y);
    });
    lengths.forEach((length) => expect(length).toBeCloseTo(lengths[0]!));
    expect(TRIANGLE_VERTICES[2]!.y).toBeGreaterThan(0);
  });

  it.each([[320, 740], [1440, 900], [2560, 720], [768, 1366]])(
    "covers %i × %i without gaps and fully uncovers it at the end", (width, height) => {
      const { panels, rays } = createBootGeometry(width, height);
      const finalScale = getOpeningScale(width, height);
      for (const scale of [1, 2, finalScale / 5, finalScale / 2, finalScale]) {
        for (let x = -width / 2 + 0.31; x < width / 2; x += width / 25) {
          for (let y = -height / 2 + 0.73; y < height / 2; y += height / 25) {
            const point = { x: x / scale, y: y / scale };
            const panelCount = panels.filter((panel) => contains(panel, point)).length;
            const aperture = contains(TRIANGLE_VERTICES, point);
            expect(panelCount + Number(aperture)).toBe(1);
            if (scale === finalScale) expect(aperture).toBe(true);
          }
        }
      }
      rays.forEach(({ start, end }, index) => {
        const previous = TRIANGLE_VERTICES[(index + 2) % 3]!;
        const cross = (start.x - previous.x) * (end.y - start.y)
          - (start.y - previous.y) * (end.x - start.x);
        expect(cross).toBeCloseTo(0);
        expect(Math.abs(end.x) > width / 2 || Math.abs(end.y) > height / 2).toBe(true);
      });
    },
  );
});

describe("boot motion sequencing", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("gives each half-second beat a 150ms hold and a slower 350ms turn", () => {
    expect(BOOT_MOTION.turnMs).toBe(500);
    expect(BOOT_MOTION.turnMs * BOOT_MOTION.holdFraction).toBe(150);
    expect(BOOT_MOTION.turnMs * (1 - BOOT_MOTION.holdFraction)).toBe(350);
    expect(getTurnSettleMs(100)).toBe(0);
    expect(getTurnSettleMs(150)).toBe(0);
    expect(getTurnSettleMs(300)).toBe(200);
    expect(getTurnSettleMs(400)).toBe(100);
    expect(getTurnSettleMs(500)).toBe(0);
    expect(getTurnSettleMs(950)).toBe(50);
  });

  it("does not start opening until all three rays finish; completes after expansion", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const records: { finish: () => void; cancel: ReturnType<typeof vi.fn>; frames: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
    const element = { animate: (frames: Keyframe[], options: KeyframeAnimationOptions) => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => { finish = resolve; });
      const cancel = vi.fn();
      records.push({ finish, cancel, frames, options });
      return { currentTime: 0, finished, cancel };
    } };
    const screen = {
      dataset: { phase: "loading" },
      querySelector: () => element,
      querySelectorAll: () => [element, element, element],
      getBoundingClientRect: () => ({ width: 1440, height: 900 }),
    };
    const controller = new AbortController();
    const motion = createBootMotion(screen as unknown as HTMLElement, controller.signal);
    expect(records[0]!.options.duration).toBe(500);
    expect(records[0]!.frames.map(({ transform, offset }) => ({ transform, offset }))).toEqual([
      { transform: "rotate(0deg)", offset: 0 },
      { transform: "rotate(0deg)", offset: 0.3 },
      { transform: "rotate(118deg)", offset: 0.86 },
      { transform: "rotate(120deg)", offset: 1 },
    ]);
    const opening = vi.fn();
    const complete = vi.fn();
    const reveal = motion.reveal(opening).then(complete);
    expect(screen.dataset.phase).toBe("rays");
    expect(records).toHaveLength(4);
    records[1]!.finish();
    records[2]!.finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(opening).not.toHaveBeenCalled();
    records[3]!.finish();
    await vi.advanceTimersByTimeAsync(BOOT_MOTION.raysHoldMs);
    expect(opening).toHaveBeenCalledOnce();
    expect(screen.dataset.phase).toBe("opening");
    expect(complete).not.toHaveBeenCalled();
    expect(records[4]!.options.duration).toBe(BOOT_MOTION.openingMs);
    records[4]!.finish();
    await reveal;
    expect(complete).toHaveBeenCalledOnce();
    controller.abort();
    records.forEach(({ cancel }) => expect(cancel).toHaveBeenCalled());
  });

  it("cancels pending waits on unmount", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const controller = new AbortController();
    const pending = waitForBoot(1000, controller.signal);
    const result = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});
