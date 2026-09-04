import i18n from "i18next";
import LanguageDetector, { type DetectorOptions } from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import zh from "../locales/zh.json";

export type DocsLanguage = "en" | "zh";

const PERSISTENT_DETECTION_OPTIONS: DetectorOptions = {
  order: ["cookie", "localStorage"],
  caches: ["cookie", "localStorage"],
  lookupCookie: "i18next",
};

const normalizeLanguage = (value?: string | null): DocsLanguage | undefined => {
  if (value?.toLowerCase().startsWith("en")) return "en";
  if (value?.toLowerCase().startsWith("zh")) return "zh";
  return undefined;
};

export const getSavedLanguage = (): DocsLanguage | undefined => {
  if (typeof document !== "undefined" && typeof document.cookie === "string") {
    const match = document.cookie.match(/(?:^|; )i18next=([^;]+)/);
    if (match?.[1]) {
      try {
        const language = normalizeLanguage(decodeURIComponent(match[1]));
        if (language) return language;
      } catch {
        // Ignore malformed preference cookies and fall back to local storage.
      }
    }
  }

  if (typeof window !== "undefined") {
    try {
      return normalizeLanguage(window.localStorage.getItem("i18nextLng"));
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const languageDetector = new LanguageDetector();

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, zh: { translation: zh } },
    lng: "zh",
    fallbackLng: "zh",
    supportedLngs: ["zh", "en"],
    load: "languageOnly",
    initAsync: false,
    interpolation: { escapeValue: false },
    detection: {
      ...PERSISTENT_DETECTION_OPTIONS,
      caches: [],
    },
    react: {
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "i", "p", "span", "strong"],
    },
  });

export const applySavedLanguage = async (): Promise<DocsLanguage> => {
  const language = getSavedLanguage() ?? "zh";

  languageDetector.init(i18n.services, PERSISTENT_DETECTION_OPTIONS);

  if (normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) !== language) {
    await i18n.changeLanguage(language);
  }

  return language;
};

export default i18n;
