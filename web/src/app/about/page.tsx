"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { HeadingLg, HeadingMd, BodyMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"

export default function AboutPage() {
  const { t } = useTranslation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative py-32 md:py-48 px-4 overflow-hidden">
          <PatternOverlay opacity={0.04} />
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-primary/20 mb-6">
                Our Story
              </Badge>
              <HeadingLg className="text-5xl md:text-7xl font-black text-primary leading-tight">
                {t('about.title_1', 'Redefining')} <span className="text-gold italic">{t('about.title_2', 'Mobility')}</span>
              </HeadingLg>
            </motion.div>

            <motion.p
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t('about.subtitle', 'We are redefining mobility and convenience in Afghanistan. Our super app brings rides, food delivery, and seamless payments into one ecosystem.')}
            </motion.p>
          </div>
        </section>

        <section className="py-24 px-4 bg-card relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="grid md:grid-cols-3 gap-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  title: t('about.mission_title', 'Our Mission'),
                  desc: t('about.mission_desc', 'To empower local communities by providing accessible, safe, and reliable transportation and delivery services.'),
                  color: "primary"
                },
                {
                  title: t('about.vision_title', 'Our Vision'),
                  desc: t('about.vision_desc', 'To become the leading digital ecosystem in the region, connecting people, merchants, and drivers seamlessly.'),
                  color: "gold"
                },
                {
                  title: t('about.values_title', 'Our Values'),
                  desc: t('about.values_desc', 'Safety first, customer obsession, community empowerment, and continuous innovation.'),
                  color: "primary"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass p-10 rounded-[2.5rem] border-none hover:-translate-y-2 transition-transform duration-300"
                >
                  <h3 className={`text-3xl font-extrabold mb-6 ${item.color === 'gold' ? 'text-gold' : 'text-primary'}`}>{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-32 px-4 text-center max-w-3xl mx-auto space-y-8">
          <HeadingMd className="text-4xl font-black text-primary italic">&quot;Building with Heart, Serving with Trust.&quot;</HeadingMd>
          <div className="h-1 w-20 bg-gold mx-auto rounded-full" />
          <BodyMd className="text-lg text-muted-foreground">
            Noori is more than just an app; it&apos;s a commitment to the people of Afghanistan. We believe in the power of technology to improve lives and create opportunities.
          </BodyMd>
        </section>
      </main>
      <Footer />
    </div>
  )
}
