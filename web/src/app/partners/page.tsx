"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { Store, Car, ArrowRight, Zap, TrendingUp, BarChart3, ShieldCheck } from "lucide-react"
import { HeadingLg, HeadingMd, HeadingSm, BodyMd, LabelMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { GlassSurface } from "@/components/ui/glass-surface"

export default function PartnersPage() {
  const partnerTypes = [
    {
      title: "Logistic Operators",
      description: "Scale your fleet operations with our enterprise-grade management layer.",
      icon: <Car className="h-6 w-6" />,
      size: "large" as const,
      header: <div className="h-40 w-full bg-primary/5 rounded-2xl flex items-center justify-center">
        <TrendingUp className="h-20 w-20 text-primary/30" />
      </div>
    },
    {
      title: "Retail Merchants",
      description: "Integrate your storefront with our sub-30 minute delivery network.",
      icon: <Store className="h-6 w-6" />,
      size: "medium" as const,
    },
    {
      title: "Infrastructure Tech",
      description: "Collaborate on next-gen mobility and mapping protocols.",
      icon: <Zap className="h-6 w-6" />,
      size: "medium" as const,
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Partnership Hero */}
        <section className="relative pt-48 pb-32 px-4 overflow-hidden">
          <div className="container mx-auto">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 1 }}
               className="text-center space-y-12"
             >
                <div className="inline-flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                   <ShieldCheck className="h-3 w-3 text-primary" />
                   <LabelMd className="text-[10px]">Verified Ecosystem Partner</LabelMd>
                </div>
                <HeadingLg className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
                   Scaling the <br/><span className="text-primary italic">Logistics Frontier.</span>
                </HeadingLg>
                <BodyMd className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                   Join the network that moves Afghanistan. We provide the infrastructure, technology, and scale to accelerate your enterprise.
                </BodyMd>
             </motion.div>
          </div>
        </section>

        {/* Opportunities Grid */}
        <section className="py-24 px-4 bg-primary/5">
          <div className="max-w-7xl mx-auto">
             <BentoGrid>
                {partnerTypes.map((item, i) => (
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

        {/* Integration Advantage */}
        <section className="py-40 px-4">
           <div className="container mx-auto">
              <GlassSurface variant="premium" className="p-16 md:p-32 border-none bento-shadow relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5"><BarChart3 size={200} /></div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10 relative z-10">
                       <HeadingMd className="text-5xl font-black leading-tight">Technology <br/>that Empowers.</HeadingMd>
                       <div className="space-y-6">
                          {[
                            { t: "Deep Analytics", d: "Real-time visibility into your delivery performance and customer trends." },
                            { t: "Automated Settlements", d: "Daily payouts and transparent financial reporting at scale." },
                            { t: "Predictive Demand", d: "AI forecasting to help you prepare for peak volume." }
                          ].map((feat, idx) => (
                            <div key={idx} className="flex gap-6">
                               <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shrink-0 text-white shadow-xl shadow-primary/20">
                                  <ArrowRight className="h-5 w-5" />
                               </div>
                               <div>
                                  <h4 className="font-bold text-xl mb-1">{feat.t}</h4>
                                  <p className="text-muted-foreground leading-relaxed">{feat.d}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="flex justify-center lg:justify-end">
                       <div className="bg-primary h-80 w-80 rounded-[4rem] shadow-2xl flex flex-col items-center justify-center text-center p-10 space-y-6">
                          <HeadingSm className="text-white">Ready to Integrate?</HeadingSm>
                          <Button size="xl" className="rounded-full h-16 w-full bg-white text-primary hover:bg-white/90 font-black text-lg">
                            Apply Now
                          </Button>
                       </div>
                    </div>
                 </div>
              </GlassSurface>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
