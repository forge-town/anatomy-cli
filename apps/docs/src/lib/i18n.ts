import i18n from "i18next";
import { languageDetector } from "./languageDetector";
import { PERSISTENT_DETECTION_OPTIONS } from "./PERSISTENT_DETECTION_OPTIONS";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import zh from "../locales/zh.json";

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

export default i18n;
