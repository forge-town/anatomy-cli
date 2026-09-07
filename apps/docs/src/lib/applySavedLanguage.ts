import i18n from "./i18n";
import { languageDetector } from "./languageDetector";
import { PERSISTENT_DETECTION_OPTIONS } from "./PERSISTENT_DETECTION_OPTIONS";
import { normalizeLanguage, type DocsLanguage } from "./normalizeLanguage";
import { getSavedLanguage } from "./getSavedLanguage";

export const applySavedLanguage = async (): Promise<DocsLanguage> => {
  const language = getSavedLanguage() ?? "zh";
  languageDetector.init(i18n.services, PERSISTENT_DETECTION_OPTIONS);
  if (normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) !== language) {
    await i18n.changeLanguage(language);
  }
  return language;
};
