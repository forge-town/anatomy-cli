export type DocsLanguage = "en" | "zh";

const normalizeLanguage = (value: string | null | undefined): DocsLanguage =>
  value?.toLowerCase().startsWith("en") ? "en" : "zh";

export const getServerLanguage = (cookieHeader?: string | null): DocsLanguage => {
  const match = cookieHeader?.match(/(?:^|;\s*)i18next=([^;]+)/);
  return normalizeLanguage(match?.[1] ? decodeURIComponent(match[1]) : undefined);
};
