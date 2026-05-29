"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-24 px-4 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            {t('about.title_1', 'About')} <span className="text-primary">{t('about.title_2', 'Noori')}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            {t('about.subtitle', 'We are redefining mobility and convenience in Afghanistan. Our super app brings rides, food delivery, and seamless payments into one ecosystem.')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left mt-16">
            <div className="p-6 bg-primary/5 rounded-2xl border">
              <h3 className="text-2xl font-bold mb-3 text-primary">{t('about.mission_title', 'Our Mission')}</h3>
              <p className="text-muted-foreground">{t('about.mission_desc', 'To empower local communities by providing accessible, safe, and reliable transportation and delivery services.')}</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-2xl border">
              <h3 className="text-2xl font-bold mb-3 text-primary">{t('about.vision_title', 'Our Vision')}</h3>
              <p className="text-muted-foreground">{t('about.vision_desc', 'To become the leading digital ecosystem in the region, connecting people, merchants, and drivers seamlessly.')}</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-2xl border">
              <h3 className="text-2xl font-bold mb-3 text-primary">{t('about.values_title', 'Our Values')}</h3>
              <p className="text-muted-foreground">{t('about.values_desc', 'Safety first, customer obsession, community empowerment, and continuous innovation.')}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
