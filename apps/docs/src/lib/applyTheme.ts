import { type DocsTheme } from "./getSavedTheme";

export const applyTheme = (theme: DocsTheme) => {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
};
