"use client"

import { FormEvent, useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { MapPin, Navigation, Shield, Clock, Car } from "lucide-react"
import { authedFetch, getStoredUser, type AuthUser } from "@/lib/auth"

type Estimate = {
  fare: number
  currency: string
  distance: number
  surgeMultiplier: number
}

export default function BookingPage() {
  const [user] = useState<AuthUser | null>(() => getStoredUser())
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [safetyCode, setSafetyCode] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.id || !pickupLocation || !dropoffLocation) {
      return
    }

    const timeout = window.setTimeout(() => {
      authedFetch("/rides/estimate?distance=5")
        .then(async (response) => {
          if (!response.ok) throw new Error("Unable to estimate fare")
          return response.json()
        })
        .then(setEstimate)
        .catch(() => setEstimate(null))
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [user?.id, pickupLocation, dropoffLocation])

  function updatePickupLocation(value: string) {
    setPickupLocation(value)
    if (!value.trim()) setEstimate(null)
  }

  function updateDropoffLocation(value: string) {
    setDropoffLocation(value)
    if (!value.trim()) setEstimate(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setStatus("")
    setSafetyCode("")

    if (!user?.id) {
      setError("Please log in before booking a ride.")
      return
    }
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      setError("Pickup and destination are required.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authedFetch("/rides", {
        method: "POST",
        body: JSON.stringify({
          customerId: user.id,
          pickupLocation,
          dropoffLocation,
          paymentMethod: "CASH",
        }),
      })

      if (!response.ok) throw new Error("Unable to create booking")
      const ride = await response.json()
      setSafetyCode(ride.safetyCode ?? "")
      setStatus(`Ride requested. Fare: AFN ${Number(ride.fare ?? estimate?.fare ?? 0).toLocaleString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm"><CardContent className="p-6 space-y-6">
                  <HeadingMd>Book a Ride</HeadingMd>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" /><Input value={pickupLocation} onChange={(event) => updatePickupLocation(event.target.value)} placeholder="Pickup" className="pl-10 h-12 bg-muted/30 border-none" /></div>
                    <div className="relative"><Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-foreground" /><Input value={dropoffLocation} onChange={(event) => updateDropoffLocation(event.target.value)} placeholder="Destination" className="pl-10 h-12 bg-muted/30 border-none" /></div>
                    <div className="rounded-lg border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Fare estimate</span></div>
                        <span className="text-lg font-bold">{estimate ? `${estimate.currency} ${estimate.fare.toLocaleString()}` : "Enter trip"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Estimated on a {estimate?.distance ?? 5} km city ride</div>
                    </div>
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    {status ? <p className="text-sm text-primary">{status}</p> : null}
                    {safetyCode ? <div className="rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary">Safety code: {safetyCode}</div> : null}
                    <Button size="xl" className="w-full mt-4 h-14 font-bold shadow-lg" disabled={isSubmitting}>{isSubmitting ? "Confirming..." : "Confirm Booking"}</Button>
                  </form>
                </CardContent></Card>
              <Card className="bg-primary/5 border-none shadow-none"><CardContent className="p-4 flex items-center gap-4"><Shield className="h-5 w-5 text-primary" /><BodyMd className="text-xs">Your safety is our priority. Trips are tracked and insured.</BodyMd></CardContent></Card>
            </div>
            <div className="lg:col-span-3"><Card className="h-full border-none shadow-sm min-h-[400px] bg-secondary/30 relative flex flex-col items-center justify-center gap-3"><MapPin className="h-10 w-10 text-primary animate-bounce" /><BodyMd className="text-sm text-muted-foreground">{pickupLocation && dropoffLocation ? `${pickupLocation} to ${dropoffLocation}` : "Choose pickup and destination"}</BodyMd></Card></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
