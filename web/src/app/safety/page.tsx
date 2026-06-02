"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShieldCheck, Eye, MapPin, Shield, Lock, Zap, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { HeadingLg, HeadingMd, BodyMd, LabelMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"

export default function SafetyPage() {
  const safetyFeatures = [
    {
      title: "Encrypted Node Verification",
      description: "Every driver and asset in the Noori ecosystem undergoes multi-layered biometric and identity verification.",
      icon: <ShieldCheck className="h-6 w-6" />,
      size: "large" as const,
      header: <div className="h-32 w-full bg-primary/5 rounded-2xl flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center"
        >
          <Lock className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    },
    {
      title: "Real-time Telemetry",
      description: "Follow your journey with sub-second latency tracking and instant sharing.",
      icon: <Activity className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Emergency Response",
      description: "Direct uplink to local authorities and Noori's 24/7 security command center.",
      icon: <Zap className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Geofencing Control",
      description: "Automatic intervention protocols if deviations from optimal routes are detected.",
      icon: <MapPin className="h-6 w-6" />,
      size: "small" as const,
    },
    {
      title: "Incident Intelligence",
      description: "AI analysis of every trip to predict and prevent potential security risks.",
      icon: <Eye className="h-6 w-6" />,
      size: "small" as const,
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto space-y-12 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <LabelMd className="mb-6 block">Ecosystem Integrity</LabelMd>
              <HeadingLg className="text-6xl md:text-8xl font-black leading-[0.9] mb-8">
                Uncompromising <br/><span className="text-primary italic">Safety Protocols.</span>
              </HeadingLg>
              <BodyMd className="text-xl md:text-2xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
                We&apos;ve built Noori with a security-first architecture. From biometric onboarding to real-time telemetry, your integrity is our core priority.
              </BodyMd>
            </motion.div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="py-24 px-4 bg-primary/5">
          <div className="max-w-7xl mx-auto">
            <BentoGrid>
              {safetyFeatures.map((feature, i) => (
                <BentoCard
                  key={i}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  header={feature.header}
                  size={feature.size}
                  className="bg-background/50"
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* Deep Dive Section */}
        <section className="py-40 px-4 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="relative">
                 <GlassSurface variant="premium" className="aspect-square rounded-[4rem] p-16 flex items-center justify-center border-none shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <PatternOverlay />
                    </div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-[20px] border-primary/5 rounded-full"
                    />
                    <div className="relative z-10 bg-primary h-40 w-40 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/40">
                       <Shield className="h-20 w-20 text-white" />
                    </div>
                 </GlassSurface>
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <Badge className="bg-primary text-white font-black px-6 py-2 rounded-full uppercase tracking-widest text-[10px]">Command Center</Badge>
                  <HeadingMd className="text-5xl font-black">24/7 Human-AI <br/>Surveillance.</HeadingMd>
                  <BodyMd className="text-lg leading-relaxed">
                    Our Global Security Command Center operates around the clock, utilizing predictive AI to monitor for anomalies and human agents to handle critical interventions.
                  </BodyMd>
                </div>

                <div className="space-y-6">
                   {[
                     { t: "Military-Grade Encryption", d: "All data nodes are secured using AES-256 standards." },
                     { t: "Zero-Downtime Resilience", d: "Decentralized architecture ensures safety protocols never sleep." },
                     { t: "Rapid Response Units", d: "Direct digital bridge to emergency services and tactical support." }
                   ].map((item, idx) => (
                     <div key={idx} className="flex gap-6 items-start">
                        <div className="h-2 w-2 bg-primary rounded-full mt-2.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-xl mb-1">{item.t}</h4>
                          <p className="text-muted-foreground">{item.d}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-4">
           <div className="max-w-5xl mx-auto text-center">
              <GlassSurface className="p-12 md:p-24 border-none bento-shadow rounded-[3rem]">
                 <HeadingMd className="mb-8 font-black">Experience the Future <br/>of Secure Logistics.</HeadingMd>
                 <BodyMd className="mb-12 max-w-xl mx-auto">
                    Join the most secure mobility network in Afghanistan and scale your operations with absolute peace of mind.
                 </BodyMd>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="xl" className="rounded-full h-16 px-12 bg-primary font-black text-lg">
                      Start Your Operation
                    </Button>
                    <Button variant="outline" size="xl" className="rounded-full h-16 px-12 font-black text-lg glass">
                      Review Compliance
                    </Button>
                 </div>
              </GlassSurface>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
