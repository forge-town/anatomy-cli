export type DocsTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "anatomy-theme";

export const THEME_PREPAINT_SCRIPT = `(()=>{try{const value=window.localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=value==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}})();`;

export const getSavedTheme = (): DocsTheme => {
  if (typeof window === "undefined") return "light";

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const applyTheme = (theme: DocsTheme) => {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
};

export const saveTheme = (theme: DocsTheme) => {
  applyTheme(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The visual preference still applies when storage is unavailable.
  }
};
