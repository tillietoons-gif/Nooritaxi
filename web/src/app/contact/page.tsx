"use client"

import React, { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "react-i18next"
import { Loader2, CheckCircle2, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ContactPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsLoading(false)
    setIsSuccess(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main id="main-content" className="flex-1 py-24 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{t('contact.title', 'Contact Us')}</h1>
            <p className="text-muted-foreground">{t('contact.subtitle', "We're here to help. Send us a message and we'll respond as soon as possible.")}</p>
          </div>
          
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="contact-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="bg-card border shadow-sm rounded-2xl p-6 md:p-8 space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.name_label', 'Name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder={t('contact.name_placeholder', 'Your name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.email_label', 'Email or Phone')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    required
                    autoComplete="email"
                    placeholder={t('contact.email_placeholder', 'you@example.com')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.message_label', 'Message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    className="min-h-[150px] resize-none"
                    placeholder={t('contact.message_placeholder', 'How can we help you?')}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('contact.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('contact.send', 'Send Message')}
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border shadow-sm rounded-2xl p-12 text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{t('contact.success_title', 'Message Sent!')}</h2>
                  <p className="text-muted-foreground">
                    {t('contact.success_message', 'Thank you for reaching out. Our team will get back to you shortly.')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4"
                >
                  {t('contact.send_another', 'Send another message')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
