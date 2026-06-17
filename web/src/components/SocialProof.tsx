"use client";

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

export default function SocialProof() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t("socialProof.testimonial1_name"),
      role: t("socialProof.testimonial1_role"),
      text: t("socialProof.testimonial1_text"),
      rating: 5,
    },
    {
      name: t("socialProof.testimonial2_name"),
      role: t("socialProof.testimonial2_role"),
      text: t("socialProof.testimonial2_text"),
      rating: 5,
    },
    {
      name: t("socialProof.testimonial3_name"),
      role: t("socialProof.testimonial3_role"),
      text: t("socialProof.testimonial3_text"),
      rating: 5,
    },
  ];

  const stats = [
    { value: "48k+", label: t("socialProof.stat_rides") },
    { value: "2.4k", label: t("socialProof.stat_drivers") },
    { value: "14", label: t("socialProof.stat_cities") },
  ];

  return (
    <section className="py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">{t("socialProof.title")}</h2>
          <p className="text-muted-foreground">{t("socialProof.subtitle")}</p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-12 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold tracking-tighter text-primary">{s.value}</div>
              <div className="text-xs uppercase tracking-[2px] text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((tItem, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-3xl border bg-card p-7 flex flex-col"
            >
              <div className="flex mb-4">
                {Array.from({ length: tItem.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <blockquote className="text-[15px] leading-relaxed text-foreground/90 flex-1">
                “{tItem.text}”
              </blockquote>
              <div className="mt-6 pt-4 border-t text-sm">
                <div className="font-semibold">{tItem.name}</div>
                <div className="text-muted-foreground text-xs tracking-wide">{tItem.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
