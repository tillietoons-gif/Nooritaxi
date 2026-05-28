"use client"
import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { MapPin, Navigation, Car, Shield, Clock } from "lucide-react"
export default function BookingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm"><CardContent className="p-6 space-y-6">
                  <HeadingMd>Book a Ride</HeadingMd>
                  <div className="space-y-4">
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" /><Input placeholder="Pickup" className="pl-10 h-12 bg-muted/30 border-none" /></div>
                    <div className="relative"><Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-foreground" /><Input placeholder="Destination" className="pl-10 h-12 bg-muted/30 border-none" /></div>
                  </div>
                  <Button size="xl" className="w-full mt-4 h-14 font-bold shadow-lg">Confirm Booking</Button>
                </CardContent></Card>
              <Card className="bg-primary/5 border-none shadow-none"><CardContent className="p-4 flex items-center gap-4"><Shield className="h-5 w-5 text-primary" /><BodyMd className="text-xs">Your safety is our priority. Trips are tracked and insured.</BodyMd></CardContent></Card>
            </div>
            <div className="lg:col-span-3"><Card className="h-full border-none shadow-sm min-h-[400px] bg-secondary/30 relative flex items-center justify-center"><MapPin className="h-10 w-10 text-primary animate-bounce" /></Card></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
