"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { HeadingLg, HeadingMd, LabelMd } from "@/components/ui/typography"
import { PatternOverlay } from "@/components/ui/pattern-overlay"

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main id="main-content" className="flex-1">
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
                <LabelMd>Legal Framework</LabelMd>
              </div>
              <HeadingLg className="text-6xl font-black leading-tight">
                Terms of <span className="text-primary italic">Service.</span>
              </HeadingLg>

              <div className="space-y-8 text-muted-foreground leading-relaxed">
                <section className="space-y-4">
                  <HeadingMd className="text-foreground">1. Acceptance of Terms</HeadingMd>
                  <p>
                    By accessing or using the Noori Mobility System platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">2. Description of Service</HeadingMd>
                  <p>
                    Noori provides a technology platform that enables users to arrange and schedule transportation and/or logistics services with third-party providers.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">3. User Accounts</HeadingMd>
                  <p>
                    To use most aspects of the Services, you must register for and maintain an active personal user account. You are responsible for all activity that occurs under your Account.
                  </p>
                </section>

                <section className="space-y-4">
                  <HeadingMd className="text-foreground">4. Privacy</HeadingMd>
                  <p>
                    Your use of the Services is also subject to our Privacy Policy, which is incorporated into these Terms by reference.
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
