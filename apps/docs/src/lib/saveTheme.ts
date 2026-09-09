import { applyTheme } from "./applyTheme";
import { type DocsTheme } from "./getSavedTheme";
import { THEME_STORAGE_KEY } from "./THEME_STORAGE_KEY";
import { Result } from "neverthrow";

export const saveTheme = (theme: DocsTheme) => {
  applyTheme(theme);

  Result.fromThrowable(() => window.localStorage.setItem(THEME_STORAGE_KEY, theme))().unwrapOr(undefined);
};
