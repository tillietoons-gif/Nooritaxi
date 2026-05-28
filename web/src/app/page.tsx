import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeadingLg, HeadingMd, BodyLg, BodyMd } from "@/components/ui/typography"
import { Car, Package, Utensils, Shield, CheckCircle2, Star, Smartphone, ArrowRight } from "lucide-react"
export default function LandingPage() {
  const services = [
    { title: "NooriTaxi", description: "Reliable rides at the tap of a button. Safe, tracked, and verified.", icon: <Car className="h-10 w-10 text-primary" />, tag: "Mobility" },
    { title: "NooriParcel", description: "Fast and secure delivery for your items across the city.", icon: <Package className="h-10 w-10 text-primary" />, tag: "Logistics" },
    { title: "NooriFood", description: "Your favorite meals delivered fresh to your doorstep.", icon: <Utensils className="h-10 w-10 text-primary" />, tag: "Delivery" }
  ]
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="relative bg-background pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 space-y-8">
                <Badge variant="secondary" className="px-3 py-1">Afghan Mobility Super App</Badge>
                <HeadingLg className="text-5xl lg:text-6xl text-primary leading-[1.1]">Clarity, Guidance, and <span className="text-accent-foreground">Safety</span> in Every Journey.</HeadingLg>
                <BodyLg className="text-muted-foreground max-w-lg">Noori is your trusted companion for daily transit, logistics, and delivery in Afghanistan. Built for extreme utility and maximum trust.</BodyLg>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="xl" className="group">Book a Ride<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button>
                  <Button variant="outline" size="xl">Become a Partner</Button>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="relative w-full aspect-square rounded-2xl bg-secondary overflow-hidden shadow-2xl flex items-center justify-center p-8">
                   <div className="bg-card w-full h-full rounded-xl shadow-inner flex flex-col items-center justify-center space-y-6">
                      <Smartphone className="h-32 w-32 text-primary/20" />
                      <div className="space-y-2 text-center">
                        <div className="h-2 w-24 bg-primary/20 rounded-full mx-auto" />
                        <div className="h-2 w-32 bg-primary/10 rounded-full mx-auto" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="services" className="py-24 bg-card">
          <div className="container mx-auto px-4 text-center space-y-4 mb-16">
            <HeadingMd className="text-primary">Everything You Need, One App</HeadingMd>
            <BodyMd className="text-muted-foreground max-w-2xl mx-auto">Noori brings essential mobility and delivery services under one roof, designed specifically for Afghanistan.</BodyMd>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {services.map((service) => (
                <Card key={service.title} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-8 space-y-6">
                    <div className="bg-secondary/50 p-4 rounded-xl w-fit mx-auto">{service.icon}</div>
                    <div className="space-y-2 text-center">
                      <Badge variant="outline" className="text-[10px] uppercase">{service.tag}</Badge>
                      <HeadingMd className="text-xl">{service.title}</HeadingMd>
                      <BodyMd className="text-muted-foreground">{service.description}</BodyMd>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
