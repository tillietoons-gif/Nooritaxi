"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShieldCheck, Eye, Phone, MapPin, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { NooriLogo } from "@/components/ui/noori-logo"
import { HeadingLg, HeadingMd, BodyMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"

export default function SafetyPage() {
  const { t } = useTranslation()
  const features = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: t('safety.feature1_title', "Driver Verification"),
      description: t('safety.feature1_desc', "Every driver undergoes comprehensive background checks and identity verification before joining our platform."),
    },
    {
      icon: <Eye className="h-10 w-10 text-primary" />,
      title: t('safety.feature2_title', "Real-time Tracking"),
      description: t('safety.feature2_desc', "Follow your ride or delivery in real-time. Share your journey with trusted contacts for added peace of mind."),
    },
    {
      icon: <Phone className="h-10 w-10 text-primary" />,
      title: t('safety.feature3_title', "In-App SOS Button"),
      description: t('safety.feature3_desc', "Emergency assistance is just a tap away. Our 24/7 support team and local authorities are instantly notified."),
    },
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: t('safety.feature4_title', "Safe Zones"),
      description: t('safety.feature4_desc', "Our system monitors rides constantly. Any unexpected deviations from the route trigger automatic check-ins."),
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-32 md:py-48 px-4 overflow-hidden">
          <PatternOverlay opacity={0.04} />
          <div className="max-w-4xl mx-auto space-y-8 text-center relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-primary/20 mb-6">
                Safety First
              </Badge>
              <HeadingLg className="text-5xl md:text-7xl font-black text-primary leading-tight">
                {t('safety.hero_title_1', 'Your Safety is Our')} <span className="text-gold italic">{t('safety.hero_title_2', 'Top Priority')}</span>
              </HeadingLg>
            </motion.div>
            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {t('safety.hero_subtitle', "At Noori, we've built our platform from the ground up with your security in mind. Discover the features that make every journey safe.")}
            </motion.p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass p-10 rounded-[2.5rem] space-y-6 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                    <NooriLogo size={120} className="text-primary" />
                  </div>
                  <div className="bg-primary/5 p-5 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    {feature.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-primary">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-32 bg-card relative overflow-hidden">
          <PatternOverlay opacity={0.03} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="lg:w-1/2 space-y-8">
                <HeadingMd className="text-4xl md:text-5xl font-black text-primary">A Culture of Mutual Trust</HeadingMd>
                <BodyMd className="text-lg text-muted-foreground leading-relaxed">
                  Safety isn&apos;t just about features; it&apos;s about the community we build. We maintain high standards for both riders and drivers to ensure a respectful and safe environment for everyone.
                </BodyMd>
                <div className="space-y-4">
                  {['24/7 Incident Response', 'Two-Way Ratings', 'Emergency Local Integration'].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="font-bold text-primary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="glass p-1 rounded-[3rem]">
                   <div className="bg-primary aspect-square rounded-[2.8rem] flex items-center justify-center relative overflow-hidden">
                      <PatternOverlay opacity={0.1} color="white" />
                      <NooriLogo size={200} color="white" className="opacity-20 animate-pulse-slow" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="h-32 w-32 text-white" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
