export const updateGridPatternHover = (
  grid: HTMLElement,
  clientX: number | null,
  clientY: number | null,
) => {
  if (clientX === null || clientY === null) return;

  grid.querySelectorAll<HTMLElement>(".startup-grid-background__pattern").forEach((pattern) => {
    const rect = pattern.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    pattern.style.setProperty("--grid-pattern-pointer-x", `${x.toFixed(3)}%`);
    pattern.style.setProperty("--grid-pattern-pointer-y", `${y.toFixed(3)}%`);
  });
};
