"use client";

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import EnhancedCTA from '@/components/EnhancedCTA';
import SocialProof from '@/components/SocialProof';
import { Button } from '@/components/ui/button';
import { Car, Truck, Users, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  const howSteps = [
    {
      icon: Car,
      title: t("howItWorks.step1_title"),
      desc: t("howItWorks.step1_desc"),
    },
    {
      icon: Users,
      title: t("howItWorks.step2_title"),
      desc: t("howItWorks.step2_desc"),
    },
    {
      icon: Shield,
      title: t("howItWorks.step3_title"),
      desc: t("howItWorks.step3_desc"),
    },
  ];

  return (
    <>
      <Header />

      <main id="main-content">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[length:4px_4px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur mb-6 text-sm">
            <Shield className="w-4 h-4" /> {t("home.badge")}
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6" dangerouslySetInnerHTML={{ __html: t("home.title") }} />
          <p className="max-w-2xl mx-auto text-xl text-white/80 mb-10">
            {t("home.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-10 text-lg h-14" asChild>
              <Link href="/book">
                {t("home.cta_primary")}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-10 text-lg h-14 border-white/40 hover:bg-white/10" asChild>
              <Link href="/signup">
                {t("home.cta_secondary")}
              </Link>
            </Button>
          </div>

          <div className="mt-8 text-sm text-white/60">
            {t("home.footer_trust")}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 text-xs tracking-[3px]">
          SCROLL TO EXPLORE <span className="mt-1">↓</span>
        </div>
      </section>

      {/* Trust / Features */}
      <section className="border-b bg-white py-12 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Car, label: "Real-time Rides", desc: "Driver matching in seconds" },
            { icon: Truck, label: "Instant Delivery", desc: "Food, parcels & more" },
            { icon: Users, label: "Fleet Solutions", desc: "Corporate & logistics" },
            { icon: Shield, label: "Safety First", desc: "Verified drivers & tracking" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="font-semibold">{f.label}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - Animated Steps (Framer Motion) */}
      <section className="py-20 border-b bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="uppercase tracking-[3px] text-xs text-primary font-bold mb-2">{t("howItWorks.subtitle")}</div>
            <h2 className="text-4xl font-semibold tracking-tight">{t("howItWorks.title")}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {howSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-3xl border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="font-semibold text-2xl mb-3 tracking-tight">{step.title}</div>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                <div className="mt-6 text-xs uppercase tracking-widest text-primary/70 group-hover:text-primary flex items-center gap-1">
                  {index + 1} / 3 <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA / Social Proof */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-center text-4xl font-semibold tracking-tight mb-3">Built for the future of movement</h2>
          <p className="text-center text-lg text-muted-foreground max-w-md mx-auto">
            {t("socialProof.subtitle")}
          </p>
        </div>

        <div className="mb-16">
          <EnhancedCTA />
        </div>

        <SocialProof />
      </section>

      {/* Quick links to other experiences */}
      <section className="bg-muted/40 py-16 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="uppercase tracking-[2px] text-xs text-muted-foreground mb-2">{t("home.quick_explore_title")}</div>
            <h3 className="text-3xl font-semibold">{t("home.quick_explore_sub")}</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { href: "/book", title: t("home.quick_ride_title"), desc: t("home.quick_ride_desc") },
              { href: "/delivery", title: t("home.quick_delivery_title"), desc: t("home.quick_delivery_desc") },
              { href: "/signup", title: t("home.quick_driver_title"), desc: t("home.quick_driver_desc") },
            ].map((item, idx) => (
              <Link key={idx} href={item.href} className="group block rounded-3xl border bg-white p-8 hover:border-primary/50 transition-colors dark:bg-slate-900">
                <div className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">{item.title}</div>
                <p className="text-muted-foreground">{item.desc}</p>
                <div className="mt-6 text-sm font-medium text-primary">{t("home.get_started")}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </>
  );
}
