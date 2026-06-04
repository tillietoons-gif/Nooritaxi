"use client"

import { useTranslation } from "react-i18next"

export function SkipToContent() {
  const { t } = useTranslation()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:font-black focus:text-xs focus:uppercase focus:tracking-widest focus:shadow-2xl focus:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
    >
      {t("accessibility.skip_to_content", "Skip to main content")}
    </a>
  )
}
