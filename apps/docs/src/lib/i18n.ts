import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import zh from "../locales/zh.json";

const getSavedLanguage = () => {
  if (typeof document !== "undefined" && typeof document.cookie === "string") {
    const match = document.cookie.match(/(?:^|; )i18next=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem("i18nextLng") ?? undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, zh: { translation: zh } },
    lng: getSavedLanguage() || "zh",
    fallbackLng: "zh",
    supportedLngs: ["zh", "en"],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      // Chinese is the product default; only an explicit saved choice may override it.
      order: ["cookie", "localStorage"],
      caches: ["cookie", "localStorage"],
      lookupCookie: "i18next",
    },
    react: {
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "i", "p", "span", "strong"],
    },
  });

export default i18n;
