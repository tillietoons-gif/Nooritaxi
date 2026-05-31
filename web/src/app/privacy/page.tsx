"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { HeadingLg, HeadingMd, BodyMd, LabelMd } from "@/components/ui/typography"
import { PatternOverlay } from "@/components/ui/pattern-overlay"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-12 bg-primary/30" />
                <LabelMd>Data Protection</LabelMd>
              </div>
              <HeadingLg className="text-6xl font-black leading-tight">
                Privacy <span className="text-primary italic">Policy.</span>
              </HeadingLg>

              <div className="space-y-8 text-muted-foreground leading-relaxed">
                <section className="space-y-4">
                  <HeadingMd className="text-foreground">1. Data Collection</HeadingMd>
                  <p>
                    We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">2. Use of Information</HeadingMd>
                  <p>
                    The information we collect is used to provide, maintain, and improve our Services, including to facilitate payments, send receipts, and provide products and services you request.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">3. Sharing of Information</HeadingMd>
                  <p>
                    We may share the information we collect about you as described in this Policy or at the time of collection or sharing, including with third-party providers who need access to such information to carry out work on our behalf.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">4. Data Security</HeadingMd>
                  <p>
                    We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.02] pointer-events-none">
            <PatternOverlay />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
