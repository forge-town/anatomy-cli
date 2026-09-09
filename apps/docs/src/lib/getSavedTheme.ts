import { THEME_STORAGE_KEY } from "./THEME_STORAGE_KEY";
import { Result } from "neverthrow";

export type DocsTheme = "dark" | "light";

export const getSavedTheme = (): DocsTheme => {
  if (typeof window === "undefined") return "light";

  return Result.fromThrowable((): DocsTheme =>
    window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light",
  )().unwrapOr("light");
};
