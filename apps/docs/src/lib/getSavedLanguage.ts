import { Result } from "neverthrow";
import { normalizeLanguage, type DocsLanguage } from "./normalizeLanguage";

export const getSavedLanguage = (): DocsLanguage | undefined => {
  if (typeof document !== "undefined" && typeof document.cookie === "string") {
    const match = document.cookie.match(/(?:^|; )i18next=([^;]+)/);
    if (match?.[1]) {
      const language = Result.fromThrowable(() => normalizeLanguage(decodeURIComponent(match[1]!)))().unwrapOr(undefined);
      if (language) return language;
    }
  }
  return typeof window === "undefined" ? undefined
    : Result.fromThrowable(() => normalizeLanguage(window.localStorage.getItem("i18nextLng")))().unwrapOr(undefined);
};
