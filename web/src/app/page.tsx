"use client"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NooriLogo } from "@/components/ui/noori-logo"
import { LogisticsNetwork } from "@/components/interactive/logistics-network"
import { Scene3D } from "@/components/interactive/scene-3d"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { GlassSurface } from "@/components/ui/glass-surface"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { HeadingLg, HeadingMd, HeadingSm, BodyLg, BodyMd, LabelMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Zap,
  Activity,
  Layers,
  Package,
} from "lucide-react"
import { useUserBehavior } from "@/components/user-behavior-provider"

const GenAIGlobe = () => {
  return (
    <div className="h-full w-full bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-20"><PatternOverlay /></div>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-40 h-40"
      >
        <div className="absolute inset-0 border-2 border-gold/20 rounded-full" style={{ transform: 'rotateX(60deg)' }} />
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" style={{ transform: 'rotateY(60deg)' }} />
        <div className="absolute inset-0 border-2 border-gold/10 rounded-full" style={{ transform: 'rotateZ(45deg) rotateX(45deg)' }} />
      </motion.div>
      <Globe className="absolute h-12 w-12 text-primary/50" />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gold/60 rounded-full blur-[1px]"
          animate={{ 
            y: [-30, 30, -30],
            x: [-30, 30, -30],
            opacity: [0.2, 1, 0.2] 
          }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          style={{ 
            top: `${30 + Math.random() * 40}%`, 
            left: `${30 + Math.random() * 40}%` 
          }}
        />
      ))}
    </div>
  )
}

const GenAIParcelFlow = () => {
  return (
    <div className="h-full w-full bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        
        <motion.div 
          className="absolute w-24 h-[2px] bg-gold/80 shadow-[0_0_15px_rgba(255,215,0,0.8)]"
          animate={{ x: ['-300%', '300%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute h-24 w-[2px] bg-primary/80 shadow-[0_0_15px_rgba(0,105,71,0.8)]"
          animate={{ y: ['-300%', '300%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
        />
        
        <div className="relative z-10 bg-background/80 backdrop-blur-md rounded-xl p-3 border border-primary/10 shadow-xl shadow-primary/5">
          <Package className="h-10 w-10 text-primary/70" />
        </div>
      </div>
    </div>
  )
}

const GenAILayers = () => {
  return (
    <div className="h-full w-full bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden relative group">
      <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
      <div className="relative w-48 h-48">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-gold/5 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-[0_0_30px_rgba(0,105,71,0.1)]"
            animate={{ 
              y: [0, -15 + i * 8, 0],
              rotate: [0, -3 + i * 3, 0],
              scale: [1, 1.05 - i * 0.02, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            style={{ zIndex: 3 - i, transformOrigin: 'bottom center' }}
          />
        ))}
        <div className="absolute inset-0 m-auto h-16 w-16 bg-background/50 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-gold/10">
          <Layers className="h-8 w-8 text-gold/70" />
        </div>
      </div>
    </div>
  )
}

const GenAITracking = () => {
  return (
    <div className="h-full w-full bg-gold/5 rounded-2xl flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-10"><PatternOverlay /></div>
      
      <motion.div 
        className="absolute inset-0 rounded-full border-r-2 border-t-2 border-primary/30 origin-center"
        style={{ width: '250%', height: '250%', top: '-75%', left: '-75%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
         <div className="w-1/2 h-1/2 bg-gradient-to-tr from-transparent to-primary/10 rounded-tr-full" />
      </motion.div>
      
      <div className="absolute w-40 h-40 border border-primary/20 rounded-full" />
      <div className="absolute w-64 h-64 border border-primary/10 rounded-full" />
      <div className="absolute w-80 h-80 border border-gold/5 rounded-full" />
      
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 bg-background/80 rounded-full p-4 border border-gold/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]"
      >
        <Activity className="h-12 w-12 text-gold/80" />
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const { behavior } = useUserBehavior()
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 200], [1, 0])
  const y1 = useTransform(scrollY, [0, 500], [0, -100])

  const greeting = behavior.timeOfDay === "morning"
    ? "Good Morning"
    : behavior.timeOfDay === "afternoon"
      ? "Good Afternoon"
      : behavior.timeOfDay === "evening"
        ? "Good Evening"
        : "Good Night";

  const services = [
    {
      title: "Intelligent Design",
      description: "Premium engineering meets aesthetic excellence in every component of our infrastructure.",
      icon: <Layers className="h-6 w-6" />,
      size: "large" as const,
      header: <GenAILayers />
    },
    {
      title: "Global Logistics",
      description: "Freight management across borders with real-time customs integration.",
      icon: <Globe className="h-6 w-6" />,
      size: "medium" as const,
      header: <GenAIGlobe />
    },
    {
      title: "Parcel Express",
      description: "On-demand hyper-local delivery for businesses and individuals.",
      icon: <Package className="h-6 w-6" />,
      size: "medium" as const,
      header: <GenAIParcelFlow />
    },
    {
      title: "Real-time Tracking",
      description: "High-fidelity WebGL visualization of every asset in your supply chain.",
      icon: <Activity className="h-6 w-6" />,
      size: "large" as const,
      header: <GenAITracking />
    }
  ]

  const sortedServices = [...services].sort((a) => {
    if (behavior.preferredService === "delivery" && a.title.includes("Tracking")) return -1;
    if (behavior.preferredService === "ride" && a.title.includes("Design")) return -1;
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative min-h-[100vh] flex items-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
            <Scene3D cameraPosition={[0, 0, 8]}>
              <LogisticsNetwork />
            </Scene3D>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              style={{ opacity, y: y1 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-[1px] w-12 bg-primary/30" />
                <LabelMd className="text-primary font-bold tracking-widest">{greeting}, {behavior.visitCount > 1 ? "Welcome Back" : "Explore Future Mobility"}</LabelMd>
              </div>

              <HeadingLg className="mb-8 leading-[1.1] text-balance">
                The Operating System for <span className="text-primary italic">Modern Logistics</span> in Afghanistan.
              </HeadingLg>

              <BodyLg className="mb-12 max-w-2xl text-xl text-muted-foreground leading-relaxed">
                Noori combines AI-driven routing, real-time WebGL tracking, and premium fleet management into a single, unified ecosystem.
              </BodyLg>

              <div className="flex flex-col sm:flex-row gap-6">
                <Button size="xl" className="rounded-full px-10 h-16 text-lg font-black bg-primary hover:bg-primary/90 shadow-[0_20px_50px_rgba(0,105,71,0.3)] group" asChild>
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="rounded-full px-10 h-16 text-lg font-black glass border-primary/20 hover:bg-primary/5" asChild>
                  <Link href="/book">View Network</Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-primary/20 flex justify-center p-1">
              <div className="w-1 h-2 bg-primary rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* BENTO GRID SERVICES */}
        <section id="services" className="py-32 relative bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div className="max-w-2xl space-y-6">
                <Badge className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full font-bold">Services</Badge>
                <HeadingMd className="font-black">Unrivaled Infrastructure. <br/>Intelligent Design.</HeadingMd>
              </div>
              <BodyMd className="max-w-sm text-lg text-muted-foreground">
                Modular components designed to scale with your business needs, from local deliveries to international freight.
              </BodyMd>
            </div>

            <BentoGrid>
              {sortedServices.map((service, i) => (
                <BentoCard
                  key={i}
                  title={service.title}
                  description={service.description}
                  header={service.header}
                  icon={service.icon}
                  size={service.size}
                  className="cursor-pointer"
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* ADAPTIVE EXPERIENCE SECTION */}
        <section className="py-32 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] animate-pulse-slow" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <Badge className="bg-gold/10 text-gold border-gold/20 font-bold px-4 py-1.5 rounded-full">Adaptive Intelligence</Badge>
                  <HeadingMd className="font-black text-4xl md:text-6xl leading-tight">A Platform that <br/><span className="text-primary">Learns from You.</span></HeadingMd>
                  <BodyLg className="text-xl leading-relaxed">
                    Noori adapts its interface in real-time based on your usage patterns. Returning users see their most-used tools prioritized instantly.
                  </BodyLg>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: "Dynamic UI", desc: "Widgets rearrange based on your frequency.", icon: <Layers className="h-6 w-6" /> },
                    { title: "Smart Defaults", desc: "Your most common routes pre-filled.", icon: <Zap className="h-6 w-6" /> },
                    { title: "Predictive Routing", desc: "AI forecasts demand before it happens.", icon: <Activity className="h-6 w-6" /> },
                    { title: "Localized Context", desc: "Adaptive language and regional settings.", icon: <Globe className="h-6 w-6" /> },
                  ].map((feat, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="flex flex-col p-6 rounded-2xl glass-premium"
                    >
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                        {feat.icon}
                      </div>
                      <h4 className="font-bold text-lg mb-2">{feat.title}</h4>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square glass-premium rounded-[3rem] p-12 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-primary opacity-5" />
                   <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[150%] h-[150%] border border-primary/10 rounded-full"
                   />
                   <div className="text-center space-y-8 z-10">
                      <div className="h-32 w-32 bg-primary rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-primary/40">
                        <NooriLogo size={60} color="white" />
                      </div>
                      <div className="space-y-2">
                        <HeadingSm>System Integrity 99.9%</HeadingSm>
                        <BodyMd>Operating at peak efficiency</BodyMd>
                      </div>
                      <Button className="rounded-full h-12 px-8 bg-primary font-bold" asChild>
                        <Link href="/dashboard">View Dashboard</Link>
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-40">
          <div className="container mx-auto px-4">
            <GlassSurface variant="premium" className="p-16 md:p-32 text-center relative overflow-hidden border-none shadow-[0_50px_100px_rgba(0,105,71,0.15)]">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <PatternOverlay />
              </div>
              <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                <HeadingLg className="leading-tight font-black">Ready for the Next <br/>Era of Mobility?</HeadingLg>
                <BodyLg className="max-w-2xl mx-auto text-2xl font-medium text-muted-foreground">
                  Join the elite businesses and individuals scaling with Noori. Experience logistics without friction.
                </BodyLg>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button size="xl" className="h-20 px-12 rounded-full text-xl font-black shadow-2xl shadow-primary/40 group" asChild>
                    <Link href="/signup">
                      Start Your Journey <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" className="h-20 px-12 rounded-full text-xl font-black glass border-primary/20" asChild>
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </div>
              </div>
            </GlassSurface>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
