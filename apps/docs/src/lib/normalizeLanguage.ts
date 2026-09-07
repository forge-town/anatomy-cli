export type DocsLanguage = "en" | "zh";

export const normalizeLanguage = (value?: string | null): DocsLanguage | undefined => {
  if (value?.toLowerCase().startsWith("en")) return "en";
  if (value?.toLowerCase().startsWith("zh")) return "zh";
  return undefined;
};
