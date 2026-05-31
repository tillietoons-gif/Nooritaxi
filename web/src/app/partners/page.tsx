"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Store, Car, ArrowRight, TrendingUp, Users, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { HeadingLg, HeadingMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PartnersPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-32 md:py-48 px-4 overflow-hidden">
          <PatternOverlay opacity={0.04} />
          <div className="max-w-4xl mx-auto space-y-8 text-center relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-primary/20 mb-6">
                Partner Ecosystem
              </Badge>
              <HeadingLg className="text-5xl md:text-7xl font-black text-primary leading-tight">
                {t('partners.hero_title_1', 'Grow Your Business with')} <span className="text-gold italic">{t('partners.hero_title_2', 'Noori')}</span>
              </HeadingLg>
            </motion.div>
            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t('partners.hero_subtitle', 'Join thousands of merchants and drivers who are earning more every day with Noori.')}
            </motion.p>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="py-24 px-4 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                icon: <Store className="w-12 h-12 text-primary" />,
                title: t('partners.restaurants_title', 'Restaurants & Stores'),
                desc: t('partners.restaurants_desc', 'Reach more customers and grow your revenue. We handle the delivery so you can focus on making great food and products.'),
                cta: t('partners.restaurants_cta', 'Become a Merchant'),
                stats: "15k+ Merchants"
              },
              {
                icon: <Car className="w-12 h-12 text-primary" />,
                title: t('partners.drivers_title', 'Drivers & Riders'),
                desc: t('partners.drivers_desc', 'Be your own boss. Drive when you want, where you want, and earn competitive rates with daily payouts.'),
                cta: t('partners.drivers_cta', 'Sign Up to Drive'),
                stats: "50k+ Drivers"
              }
            ].map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass p-12 rounded-[3rem] text-center flex flex-col items-center group relative overflow-hidden"
              >
                <div className="bg-primary/5 p-8 rounded-3xl mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-inner">
                  {partner.icon}
                </div>
                <Badge className="mb-4 bg-gold/10 text-gold border-gold/20 font-bold">{partner.stats}</Badge>
                <h2 className="text-3xl font-black mb-6 text-primary">{partner.title}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-10">{partner.desc}</p>
                <Button size="lg" className="w-full h-14 rounded-2xl font-bold group-hover:shadow-lg transition-all">
                  {partner.cta} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Partner Section */}
        <section className="py-32 bg-card relative overflow-hidden">
          <PatternOverlay opacity={0.03} />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <HeadingMd className="text-4xl font-black text-primary mb-20">Why Partner with Us?</HeadingMd>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                { icon: <TrendingUp className="h-8 w-8" />, title: "More Revenue", desc: "Unlock new sales channels and reach a wider audience." },
                { icon: <Users className="h-8 w-8" />, title: "Brand Exposure", desc: "Get featured on Afghanistan's most popular super app." },
                { icon: <Shield className="h-8 w-8" />, title: "Dedicated Support", desc: "Our local support team is here to help you 24/7." }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-4"
                >
                  <div className="h-16 w-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {benefit.icon}
                  </div>
                  <h4 className="text-xl font-bold text-primary">{benefit.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
