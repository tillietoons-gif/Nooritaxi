"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const updateDir = () => {
      const isRtl = i18n.language === 'fa' || i18n.language === 'ps';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = i18n.language;
    };

    updateDir();
    i18n.on('languageChanged', updateDir);

    return () => {
      i18n.off('languageChanged', updateDir);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
