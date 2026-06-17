"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';

export default function EnhancedCTA() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    // Simulate conversion / API
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setEmail('');
      // reset after a few seconds
      setTimeout(() => setSubmitted(false), 2800);
    }, 420);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-surface p-8 md:p-10 rounded-3xl text-center border border-white/10 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#00694710_0.6px,transparent_1px)] bg-[length:3px_3px]" />

      <div className="relative">
        <h3 className="text-3xl md:text-4xl font-bold tracking-tighter mb-3">{t("cta.title")}</h3>
        <p className="text-xl text-muted-foreground mb-8">{t("cta.subtitle")}</p>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1 relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("cta.email_placeholder")}
                  aria-label={t("cta.email_label")}
                  className="w-full bg-background/80 border border-border focus:border-primary rounded-2xl h-14 px-5 text-base placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center justify-center gap-2 h-14 px-9 rounded-2xl bg-primary hover:bg-primary/90 active:bg-primary text-primary-foreground font-semibold text-base shadow-xl shadow-primary/25 disabled:opacity-70 transition-all"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {t("cta.subscribe")} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex items-center justify-center gap-3 text-primary font-medium h-14"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              {t("cta.success")}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); /* could open app store modal */ }}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            {t("cta.button")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </a>
        </div>

        {/* Micro trust badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-1 text-[11px] uppercase tracking-[1.5px] text-muted-foreground/70">
          <div>256-bit encrypted</div>
          <div>30s avg. response</div>
          <div>4.9★ app rating</div>
        </div>
      </div>
    </motion.div>
  );
}
