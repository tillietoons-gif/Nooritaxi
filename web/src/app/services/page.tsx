"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { HeadingLg, BodyMd, LabelMd } from "@/components/ui/typography"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Car, Package, Utensils, Heart, Shield } from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      title: "Ride Hailing",
      description: "Premium on-demand transportation with vetted drivers and real-time tracking.",
      icon: <Car className="h-6 w-6" />,
      size: "large" as const,
      header: <div className="h-40 w-full bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden relative">
         <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
         <Car className="h-16 w-16 text-primary/40" />
      </div>
    },
    {
      title: "Parcel Delivery",
      description: "Instant delivery solutions for documents, packages, and logistics.",
      icon: <Package className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Food Delivery",
      description: "Your favorite meals from local restaurants delivered to your door.",
      icon: <Utensils className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Noori Pink",
      description: "Exclusive transportation services for women, by women.",
      icon: <Heart className="h-6 w-6" />,
      size: "large" as const,
      header: <div className="h-40 w-full bg-accent/5 rounded-2xl flex items-center justify-center overflow-hidden relative">
         <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
         <Heart className="h-16 w-16 text-accent/40" />
      </div>
    },
    {
       title: "Enterprise Fleet",
       description: "Custom logistics solutions for large-scale operations.",
       icon: <Shield className="h-6 w-6" />,
       size: "medium" as const,
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="container mx-auto">
            <div className="max-w-4xl space-y-12 mb-24">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-[1px] w-12 bg-primary/30" />
                  <LabelMd>Service Portfolio</LabelMd>
                </div>
                <HeadingLg className="text-6xl md:text-8xl font-black leading-[0.9] mb-12">
                  Unified <br/><span className="text-primary italic">Mobility Solutions.</span>
                </HeadingLg>
                <BodyMd className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Explore our comprehensive suite of services designed to move people and goods across Afghanistan with speed and safety.
                </BodyMd>
              </motion.div>
            </div>

            <BentoGrid>
              {services.map((service, i) => (
                <BentoCard
                  key={i}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  size={service.size}
                  header={service.header}
                  className="bg-background/50"
                />
              ))}
            </BentoGrid>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
