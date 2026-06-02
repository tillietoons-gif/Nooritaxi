"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { HeadingLg, HeadingMd, BodyMd, LabelMd } from "@/components/ui/typography"
import { GlassSurface } from "@/components/ui/glass-surface"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Globe, Users, Target, Rocket } from "lucide-react"

export default function AboutPage() {
  const missionItems = [
    {
      title: "Our Mission",
      description: "Empowering Afghanistan by digitizing the movement of people and goods with unrivaled efficiency.",
      icon: <Target className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Our Vision",
      description: "To become the unified operating system for regional logistics and mobility.",
      icon: <Rocket className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Core Integrity",
      description: "Safety and transparency are built into every line of code we write.",
      icon: <Globe className="h-6 w-6" />,
      size: "large" as const,
      header: <div className="h-40 w-full bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
        <Users className="h-16 w-16 text-primary/40" />
      </div>
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Editorial Hero */}
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="container mx-auto">
            <div className="max-w-4xl space-y-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-[1px] w-12 bg-primary/30" />
                  <LabelMd>The Noori Narrative</LabelMd>
                </div>
                <HeadingLg className="text-6xl md:text-8xl font-black leading-[0.9] mb-12">
                  Redefining the <br/><span className="text-primary italic">Geometry of Motion.</span>
                </HeadingLg>
                <BodyMd className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Noori isn&apos;t just a super app. It&apos;s a technological response to the infrastructure challenges of a nation on the move.
                </BodyMd>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Modular Grid */}
        <section className="py-24 px-4 bg-primary/5">
          <div className="max-w-7xl mx-auto">
            <BentoGrid>
              {missionItems.map((item, i) => (
                <BentoCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  size={item.size}
                  header={item.header}
                  className="bg-background/50"
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="py-40 px-4 relative">
          <div className="container mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="order-2 lg:order-1">
                   <GlassSurface variant="premium" className="p-12 md:p-20 border-none bento-shadow space-y-10">
                      <HeadingMd className="font-black">Built for Resilience.</HeadingMd>
                      <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                        <p>
                          Founded in Kabul, Noori was born from the necessity of reliable transportation in a rapidly evolving landscape. Our engineering team prioritizes performance on low-bandwidth networks and security in complex environments.
                        </p>
                        <p>
                          Today, we serve thousands of users daily, connecting them to essential services through an interface that feels like the future, today.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-border/50">
                        <p className="text-sm font-black uppercase tracking-widest text-primary italic">&quot;Excellence is our only standard.&quot;</p>
                      </div>
                   </GlassSurface>
                </div>
                <div className="order-1 lg:order-2 space-y-12">
                   <div className="aspect-square bg-primary/5 rounded-[4rem] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20"><PatternOverlay /></div>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="h-64 w-64 bg-primary rounded-[3rem] shadow-2xl flex items-center justify-center"
                      >
                         <Globe className="h-32 w-32 text-white/20" />
                      </motion.div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
