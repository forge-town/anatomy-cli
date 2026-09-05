import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppBootScreen } from "@/components/AppBootScreen/AppBootScreen";
import "@/lib/i18n";
import { THEME_PREPAINT_SCRIPT } from "@/lib/theme";

export const RootDocument = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = (i18n.resolvedLanguage ?? i18n.language ?? "zh").startsWith("en")
      ? "en"
      : "zh-CN";
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT_SCRIPT }} />
        <HeadContent />
        <noscript>
          <style>{"html{overflow:auto!important}.app-boot-screen{display:none!important}.app-boot-content{visibility:visible!important;opacity:1!important}"}</style>
        </noscript>
      </head>
      <body>
        <AppBootScreen />
        <div className="app-boot-content">
          <Outlet />
        </div>
        <Scripts />
      </body>
    </html>
  );
};
