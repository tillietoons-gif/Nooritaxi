"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LabelMd, HeadingMd, BodyMd } from "@/components/ui/typography"
import { GlassSurface } from "@/components/ui/glass-surface"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle2, MessageSquare } from "lucide-react"

export default function ContactPage() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSuccess(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Header />
      <main id="main-content" className="flex-1 relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold/10 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 mb-6">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Global Uplink</span>
              </div>
              <HeadingMd className="text-5xl md:text-6xl font-black mb-6">{t('contact.title', 'Get in Touch')}</HeadingMd>
              <BodyMd className="text-xl max-w-2xl mx-auto leading-relaxed">
                {t('contact.subtitle', "Our command center is standing by. Reach out for partnership inquiries, technical support, or fleet opportunities.")}
              </BodyMd>
            </motion.div>
          </div>
          
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="contact-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <GlassSurface variant="premium" className="p-8 md:p-12 border-none bento-shadow rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none">
                    <PatternOverlay />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <LabelMd htmlFor="name" className="text-xs font-black">{t('contact.name_label', 'Identity')}</LabelMd>
                        <Input
                          id="name"
                          required
                          className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold px-6"
                          placeholder={t('contact.name_placeholder', 'Your full name')}
                        />
                      </div>
                      <div className="space-y-3">
                        <LabelMd htmlFor="email" className="text-xs font-black">{t('contact.email_label', 'Communication Node')}</LabelMd>
                        <Input
                          id="email"
                          type="email"
                          required
                          className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold px-6"
                          placeholder={t('contact.email_placeholder', 'email@example.af')}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <LabelMd htmlFor="message" className="text-xs font-black">{t('contact.message_label', 'Transmission')}</LabelMd>
                      <Textarea
                        id="message"
                        required
                        className="min-h-[160px] rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold p-6 resize-none"
                        placeholder={t('contact.message_placeholder', 'How can we assist your operation?')}
                      />
                    </div>
                    <Button
                      className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('contact.sending', 'Transmitting...')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {t('contact.send', 'Send Message')}
                          <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                      )}
                    </Button>
                  </form>
                </GlassSurface>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <GlassSurface variant="premium" className="p-16 text-center border-none bento-shadow rounded-[3rem]">
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                  <HeadingMd className="mb-4 font-black">{t('contact.success_title', 'Transmission Received')}</HeadingMd>
                  <BodyMd className="text-lg mb-10">
                    {t('contact.success_message', 'Your message has been securely transmitted to our team. Expect a response within 24 operational hours.')}
                  </BodyMd>
                  <Button
                    variant="outline"
                    className="h-14 px-10 rounded-full font-black uppercase tracking-widest glass"
                    onClick={() => setIsSuccess(false)}
                  >
                    {t('contact.new_message', 'Send Another Message')}
                  </Button>
                </GlassSurface>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
