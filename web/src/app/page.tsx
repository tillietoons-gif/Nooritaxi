"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { HeadingLg, HeadingMd, BodyLg, BodyMd, LabelSm } from "@/components/ui/typography"
import { Car, Package, Utensils, Smartphone, ArrowRight, Shield, Globe, Clock, MapPin, Star } from "lucide-react"
import { motion } from "framer-motion"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { NooriLogo } from "@/components/ui/noori-logo"

export default function LandingPage() {
  const services = [
    {
      title: "NooriTaxi",
      description: "Reliable rides at the tap of a button. Safe, tracked, and verified.",
      icon: <Car className="h-10 w-10 text-primary" />,
      tag: "Mobility",
      color: "emerald"
    },
    {
      title: "NooriParcel",
      description: "Fast and secure delivery for your items across the city.",
      icon: <Package className="h-10 w-10 text-primary" />,
      tag: "Logistics",
      color: "gold"
    },
    {
      title: "NooriFood",
      description: "Your favorite meals delivered fresh to your doorstep.",
      icon: <Utensils className="h-10 w-10 text-primary" />,
      tag: "Delivery",
      color: "emerald"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 md:pt-48 md:pb-48 overflow-hidden bg-background">
          <PatternOverlay opacity={0.05} />

          {/* Animated Background Blobs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                className="lg:w-1/2 space-y-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-primary/20">
                    Afghan Mobility Super App
                  </Badge>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                  <HeadingLg className="text-5xl md:text-7xl font-extrabold text-primary leading-[1.05] tracking-tight text-balance">
                    Clarity, Guidance, and <span className="text-gold italic">Safety</span> in Every Journey.
                  </HeadingLg>
                  <BodyLg className="text-muted-foreground max-w-xl text-xl leading-relaxed">
                    Noori is your trusted companion for daily transit, logistics, and delivery in Afghanistan. Built for extreme utility and maximum trust.
                  </BodyLg>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5">
                  <Button size="xl" className="group h-16 px-8 text-lg font-bold shadow-xl shadow-primary/20" asChild>
                    <Link href="/book">
                      Book a Ride
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" className="h-16 px-8 text-lg font-bold border-2 hover:bg-secondary/50" asChild>
                    <Link href="/partners">Become a Partner</Link>
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center overflow-hidden">
                        <div className="h-full w-full bg-primary/20" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex text-gold">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Trusted by 50k+ users</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="lg:w-1/2 relative"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
                  {/* Floating App Mockup */}
                  <div className="absolute inset-0 glass rounded-[3rem] p-4 shadow-2xl overflow-hidden animate-float">
                    <div className="bg-background w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
                      {/* App Header */}
                      <div className="h-16 bg-primary flex items-center justify-between px-6">
                        <NooriLogo size={24} color="white" />
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                      </div>

                      {/* App Content Preview */}
                      <div className="p-6 space-y-6 flex-1 overflow-hidden">
                        <div className="space-y-2">
                           <div className="h-4 w-2/3 bg-muted rounded-full" />
                           <div className="h-8 w-full bg-muted rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="aspect-square bg-primary/5 rounded-2xl flex items-center justify-center"><Car className="h-8 w-8 text-primary" /></div>
                           <div className="aspect-square bg-primary/5 rounded-2xl flex items-center justify-center"><Package className="h-8 w-8 text-primary" /></div>
                        </div>
                        <div className="h-32 w-full bg-secondary rounded-2xl relative overflow-hidden">
                           <PatternOverlay opacity={0.1} />
                           <div className="absolute inset-0 flex items-center justify-center"><MapPin className="h-8 w-8 text-primary animate-bounce" /></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-8 -right-8 h-24 w-24 bg-gold rounded-full flex items-center justify-center shadow-xl z-20 animate-pulse">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -bottom-8 -left-8 glass p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center"><Clock className="h-6 w-6 text-primary" /></div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Average Arrival</p>
                      <p className="text-lg font-extrabold text-primary">3.5 Mins</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 relative bg-card overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center space-y-4 mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary font-bold">Our Services</Badge>
              <HeadingMd className="text-4xl md:text-5xl font-extrabold text-primary">Everything You Need, One App</HeadingMd>
              <BodyMd className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Noori brings essential mobility and delivery services under one roof, designed specifically for the unique needs of Afghanistan.
              </BodyMd>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-2xl transition-all duration-500 border-none glass hover:-translate-y-2 overflow-hidden h-full">
                    <CardContent className="p-10 space-y-8 relative">
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                        <NooriLogo size={80} className="text-primary" />
                      </div>
                      <div className="bg-primary/5 p-6 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                        {service.icon}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <LabelSm className="text-gold font-black">{service.tag}</LabelSm>
                          <HeadingMd className="text-2xl font-extrabold group-hover:text-primary transition-colors">{service.title}</HeadingMd>
                        </div>
                        <BodyMd className="text-muted-foreground text-base leading-relaxed">
                          {service.description}
                        </BodyMd>
                        <Button variant="ghost" className="p-0 h-auto font-bold group-hover:text-primary" asChild>
                           <Link href="/book">Learn more <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Noori Section */}
        <section className="py-32 bg-background relative overflow-hidden">
          <PatternOverlay opacity={0.03} />
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <motion.div
                className="lg:w-1/2 space-y-12"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="space-y-6">
                  <Badge className="bg-gold/10 text-gold border-gold/20 font-bold px-4 py-1.5">Why Choose Noori?</Badge>
                  <HeadingMd className="text-4xl md:text-5xl font-extrabold text-primary">Uncompromising Safety & Localized Experience</HeadingMd>
                  <BodyMd className="text-muted-foreground text-lg leading-relaxed">
                    We&apos;ve built Noori from the ground up to address the specific challenges and cultural nuances of Afghanistan.
                  </BodyMd>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: "24/7 Security", desc: "Monitored trips with real-time tracking.", icon: <Shield className="h-6 w-6" /> },
                    { title: "Cash or Wallet", desc: "Flexible payment for maximum accessibility.", icon: <Star className="h-6 w-6" /> },
                    { title: "Localized", desc: "Dari, Pashto, and English support.", icon: <Globe className="h-6 w-6" /> },
                    { title: "Fast Flows", desc: "Optimized for low-bandwidth networks.", icon: <Clock className="h-6 w-6" /> },
                  ].map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center shrink-0 text-primary">
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-primary">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground leading-snug">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white">
                   <div className="aspect-video bg-primary flex items-center justify-center p-12 relative">
                      <PatternOverlay opacity={0.1} />
                      <div className="text-center space-y-6 z-10">
                        <Smartphone className="h-24 w-24 text-white/20 mx-auto" />
                        <HeadingMd className="text-white text-3xl font-black">Experience the Super App</HeadingMd>
                        <Button variant="secondary" size="lg" className="h-14 px-8 font-black rounded-full shadow-xl">
                          Download Now
                        </Button>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              className="bg-primary rounded-[3rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-primary/30"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <PatternOverlay opacity={0.1} color="white" />
              <div className="relative z-10 space-y-6">
                <NooriLogo size={80} color="white" className="mx-auto mb-8 animate-pulse-slow" />
                <HeadingLg className="text-white text-4xl md:text-6xl font-black leading-tight text-balance">Ready to start your journey with Noori?</HeadingLg>
                <BodyLg className="text-white/80 text-xl max-w-2xl mx-auto font-medium">
                  Join thousands of satisfied users and experience the best mobility service in the country.
                </BodyLg>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <Button size="xl" variant="secondary" className="h-16 px-10 text-lg font-black shadow-lg" asChild>
                    <Link href="/signup">Sign Up Today</Link>
                  </Button>
                  <Button size="xl" variant="outline" className="h-16 px-10 text-lg font-black bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
                    <Link href="/partners">Partner With Us</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
