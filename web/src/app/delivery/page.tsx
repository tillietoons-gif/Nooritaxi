"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Scene3D } from '@/components/interactive/scene-3d';
import { LogisticsNetwork } from '@/components/interactive/logistics-network';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, MapPin, Clock, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DeliveryPage() {
  const { t } = useTranslation();

  const features = [
    { icon: Package, title: t("delivery.feature1_title"), desc: t("delivery.feature1_desc") },
    { icon: MapPin, title: t("delivery.feature2_title"), desc: t("delivery.feature2_desc") },
    { icon: Clock, title: t("delivery.feature3_title"), desc: t("delivery.feature3_desc") },
    { icon: Code2, title: t("delivery.feature4_title"), desc: t("delivery.feature4_desc") },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />

      <main id="main-content">
      {/* Immersive 3D Hero */}
      <div className="relative h-[100dvh]">
        <Scene3D cameraPosition={[-3.5, 0.5, 8]}>
          <LogisticsNetwork />
        </Scene3D>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 max-w-3xl">
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-white/10 text-xs tracking-[3px] uppercase">{t("delivery.hero_tag")}</div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-2.5px] mb-4">{t("delivery.title")}</h1>
            <p className="text-2xl text-white/90 mb-9">{t("delivery.subtitle")}</p>
            <Button size="lg" className="h-14 px-12 text-lg rounded-2xl" asChild>
              <Link href="/book">{t("delivery.cta_send")}</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] tracking-[4px] text-white/50">SCROLL FOR DETAILS ↓</div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
        <div className="uppercase tracking-[3px] text-xs text-primary/80 mb-3 text-center">{t("delivery.hero_tag")}</div>
        <h2 className="text-center text-4xl font-semibold tracking-tight mb-12">{t("delivery.features_title")}</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 p-8 bg-white/5"
            >
              <div className="h-10 w-10 mb-6 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-semibold tracking-tight mb-2">{f.title}</div>
              <p className="text-white/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Second immersive 3D + CTA */}
      <section className="relative py-20 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="h-[340px] -mx-6 md:mx-auto md:max-w-3xl mb-12 rounded-3xl overflow-hidden border border-white/10">
            <Scene3D cameraPosition={[4, -0.5, 6.5]}>
              <LogisticsNetwork />
            </Scene3D>
          </div>

          <h3 className="text-4xl tracking-tighter font-semibold mb-4">Track every parcel in stunning 3D</h3>
          <p className="text-white/70 max-w-md mx-auto mb-8">See your delivery move through the city with precision and clarity.</p>

          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-black" asChild>
            <Link href="/book">{t("delivery.cta_send")}</Link>
          </Button>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}