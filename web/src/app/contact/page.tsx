"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Send, CheckCircle2, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GlassSurface } from "@/components/ui/glass-surface"
import { LabelMd, HeadingMd, BodyMd } from "@/components/ui/typography"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { useTranslation } from "react-i18next"

export default function ContactPage() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSuccess(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main id="main-content" className="flex-1 relative py-24 px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center space-y-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 mb-6">
                <Mail className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Support Center</span>
              </div>
              <HeadingMd className="font-black text-5xl mb-4">{t('contact.title', 'Contact Us')}</HeadingMd>
              <BodyMd className="text-xl max-w-2xl mx-auto">
                {t('contact.subtitle', "We're here to help. Send us a message and we'll respond as soon as possible.")}
              </BodyMd>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Contact Info Sidebar */}
            <motion.div
              className="md:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GlassSurface variant="premium" className="p-8 space-y-8 relative overflow-hidden bg-card/50 backdrop-blur-md">
                <PatternOverlay opacity={0.03} />
                <div>
                  <LabelMd className="mb-4 block text-primary" htmlFor="">Headquarters</LabelMd>
                  <p className="text-sm font-bold leading-relaxed text-foreground">
                    Kart-e-Char, District 3<br />
                    Kabul, Afghanistan
                  </p>
                </div>
                <div>
                  <LabelMd className="mb-4 block text-primary" htmlFor="">Inquiries</LabelMd>
                  <p className="text-sm font-bold text-foreground">support@noori.af</p>
                  <p className="text-sm font-bold text-foreground">+93 700 000 000</p>
                </div>
                <div className="pt-4 border-t border-primary/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Average Response Time: &lt; 2 Hours
                  </p>
                </div>
              </GlassSurface>
            </motion.div>

            {/* Main Form Area */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <GlassSurface variant="premium" className="p-8 md:p-10 bento-shadow border-none relative bg-card/50 backdrop-blur-md">
                <AnimatePresence mode="wait">
                  {!isSuccess ? (
                    <motion.form
                      key="contact-form"
                      onSubmit={handleSubmit}
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <LabelMd htmlFor="name" className="text-primary">{t('contact.name_label', 'Name')}</LabelMd>
                          <Input
                            id="name"
                            required
                            placeholder={t('contact.name_placeholder', 'Your name')}
                            className="h-12 bg-background/50 border-input focus-visible:ring-primary/30 font-bold text-foreground placeholder:text-muted-foreground/50"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelMd htmlFor="email" className="text-primary">{t('contact.email_label', 'Email')}</LabelMd>
                          <Input
                            id="email"
                            type="email"
                            required
                            placeholder={t('contact.email_placeholder', 'you@example.com')}
                            className="h-12 bg-background/50 border-input focus-visible:ring-primary/30 font-bold text-foreground placeholder:text-muted-foreground/50"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <LabelMd htmlFor="message" className="text-primary">{t('contact.message_label', 'Message')}</LabelMd>
                        <Textarea
                          id="message"
                          required
                          placeholder={t('contact.message_placeholder', 'How can we help you?')}
                          className="min-h-[160px] bg-background/50 border-input focus-visible:ring-primary/30 font-bold resize-none text-foreground placeholder:text-muted-foreground/50"
                          value={formData.message}
                          onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('contact.submitting', 'Sending...')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {t('contact.send', 'Send Message')}
                            <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </div>
                        )}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success-state"
                      className="py-12 text-center space-y-6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                      <HeadingMd className="font-black text-foreground">{t('contact.success_title', 'Message Sent')}</HeadingMd>
                      <BodyMd className="max-w-xs mx-auto text-muted-foreground">
                        {t('contact.success_message', 'Your message has been received. We will get back to you shortly.')}
                      </BodyMd>
                      <Button
                        variant="ghost"
                        className="mt-4 font-black uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => setIsSuccess(false)}
                      >
                        {t('contact.send_another', 'Send Another Message')} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassSurface>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
