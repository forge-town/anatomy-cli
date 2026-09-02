import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export const RootDocument = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = (i18n.resolvedLanguage ?? i18n.language ?? "zh").startsWith("en") ? "en" : "zh-CN";
  }, [i18n.language, i18n.resolvedLanguage]);

  return <html lang="zh-CN"><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>;
};
