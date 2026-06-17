"use client"

import { FormEvent, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { GlassSurface } from "@/components/ui/glass-surface"
import { MapPin, Navigation, Shield, Clock, Car, Zap } from "lucide-react"
import { authedFetch, getStoredUser, type AuthUser } from "@/lib/auth"
import type { BookingPlace } from "@/components/booking/PlacesBookingMap"

const PlacesBookingMap = dynamic(() => import("@/components/booking/PlacesBookingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
})

type Estimate = {
  fare: number
  currency: string
  distance: number
  surgeMultiplier: number
}

function distanceKm(a?: BookingPlace | null, b?: BookingPlace | null) {
  if (!a || !b) return 5
  const radiusKm = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.max(1, Math.round(radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10)
}

export default function BookingPage() {
  const [user] = useState<AuthUser | null>(() => getStoredUser())
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [pickupPlace, setPickupPlace] = useState<BookingPlace | null>(null)
  const [dropoffPlace, setDropoffPlace] = useState<BookingPlace | null>(null)
  const [pickupSuggestions, setPickupSuggestions] = useState<BookingPlace[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<BookingPlace[]>([])
  const [pickupActiveIndex, setPickupActiveIndex] = useState(-1)
  const [dropoffActiveIndex, setDropoffActiveIndex] = useState(-1)
  const [mapPlaces, setMapPlaces] = useState<BookingPlace[]>([])
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [safetyCode, setSafetyCode] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    authedFetch("/places?limit=25")
      .then((res) => (res.ok ? res.json() : []))
      .then((places: BookingPlace[]) => setMapPlaces(places))
      .catch(() => setMapPlaces([]))
  }, [])

  useEffect(() => {
    if (!user?.id || !pickupLocation || !dropoffLocation) {
      setEstimate(null)
      setIsEstimating(false)
      return
    }

    setIsEstimating(true)
    const timeout = window.setTimeout(() => {
      const distance = distanceKm(pickupPlace, dropoffPlace)
      const params = new URLSearchParams({ distance: String(distance) })
      if (pickupPlace) {
        params.set("lat", String(pickupPlace.lat))
        params.set("lng", String(pickupPlace.lng))
      }
      authedFetch(`/trips/estimate?${params.toString()}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Unable to estimate fare")
          return response.json()
        })
        .then(setEstimate)
        .catch(() => setEstimate(null))
        .finally(() => setIsEstimating(false))
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [user?.id, pickupLocation, dropoffLocation, pickupPlace, dropoffPlace])

  useEffect(() => {
    const query = pickupLocation.trim()
    if (pickupPlace?.name === pickupLocation || query.length < 2) {
      setPickupSuggestions([])
      setPickupActiveIndex(-1)
      return
    }
    const timeout = window.setTimeout(() => {
      authedFetch(`/places?q=${encodeURIComponent(query)}&limit=6`)
        .then((res) => (res.ok ? res.json() : []))
        .then((places: BookingPlace[]) => setPickupSuggestions(places))
        .catch(() => setPickupSuggestions([]))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [pickupLocation, pickupPlace])

  useEffect(() => {
    const query = dropoffLocation.trim()
    if (dropoffPlace?.name === dropoffLocation || query.length < 2) {
      setDropoffSuggestions([])
      setDropoffActiveIndex(-1)
      return
    }
    const timeout = window.setTimeout(() => {
      authedFetch(`/places?q=${encodeURIComponent(query)}&limit=6`)
        .then((res) => (res.ok ? res.json() : []))
        .then((places: BookingPlace[]) => setDropoffSuggestions(places))
        .catch(() => setDropoffSuggestions([]))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [dropoffLocation, dropoffPlace])

  function updatePickupLocation(value: string) {
    setPickupLocation(value)
    setPickupPlace(null)
    if (!value.trim()) setEstimate(null)
  }

  function updateDropoffLocation(value: string) {
    setDropoffLocation(value)
    setDropoffPlace(null)
    if (!value.trim()) setEstimate(null)
  }

  function selectPickup(place: BookingPlace) {
    setPickupPlace(place)
    setPickupLocation(place.name)
    setPickupSuggestions([])
    setPickupActiveIndex(-1)
  }

  function selectDropoff(place: BookingPlace) {
    setDropoffPlace(place)
    setDropoffLocation(place.name)
    setDropoffSuggestions([])
    setDropoffActiveIndex(-1)
  }

  function handlePickupKeyDown(e: React.KeyboardEvent) {
    if (pickupSuggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setPickupActiveIndex((prev) => (prev + 1) % pickupSuggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setPickupActiveIndex((prev) => (prev - 1 + pickupSuggestions.length) % pickupSuggestions.length)
        break
      case "Enter":
        if (pickupActiveIndex >= 0) {
          e.preventDefault()
          selectPickup(pickupSuggestions[pickupActiveIndex])
        }
        break
      case "Escape":
        setPickupSuggestions([])
        setPickupActiveIndex(-1)
        break
    }
  }

  function handleDropoffKeyDown(e: React.KeyboardEvent) {
    if (dropoffSuggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setDropoffActiveIndex((prev) => (prev + 1) % dropoffSuggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setDropoffActiveIndex((prev) => (prev - 1 + dropoffSuggestions.length) % dropoffSuggestions.length)
        break
      case "Enter":
        if (dropoffActiveIndex >= 0) {
          e.preventDefault()
          selectDropoff(dropoffSuggestions[dropoffActiveIndex])
        }
        break
      case "Escape":
        setDropoffSuggestions([])
        setDropoffActiveIndex(-1)
        break
    }
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
      const response = await authedFetch("/trips", {
        method: "POST",
        body: JSON.stringify({
          customerId: user.id,
          pickupLocation,
          dropoffLocation,
          pickupLat: pickupPlace?.lat,
          pickupLng: pickupPlace?.lng,
          dropoffLat: dropoffPlace?.lat,
          dropoffLng: dropoffPlace?.lng,
          distance: distanceKm(pickupPlace, dropoffPlace),
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
      <main id="main-content" className="flex-1 bg-muted/20 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
              <Card className="border-none shadow-sm"><CardContent className="p-6 space-y-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full border border-primary/10 mb-2">
                      <Zap className="h-3 w-3 text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Routing</span>
                    </div>
                    <HeadingMd>Book a Ride</HeadingMd>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                      <Label htmlFor="pickup" className="sr-only">Pickup Location</Label>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="pickup"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={pickupSuggestions.length > 0}
                        aria-haspopup="listbox"
                        aria-controls="pickup-suggestions"
                        aria-activedescendant={pickupActiveIndex >= 0 ? `pickup-option-${pickupActiveIndex}` : undefined}
                        value={pickupLocation}
                        onChange={(event) => updatePickupLocation(event.target.value)}
                        onKeyDown={handlePickupKeyDown}
                        placeholder="Pickup"
                        className="pl-10 h-12 bg-muted/30 border-none focus-visible:ring-primary/30"
                      />
                      {pickupSuggestions.length > 0 ? (
                        <div id="pickup-suggestions" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-lg">
                          {pickupSuggestions.map((place, index) => (
                            <button
                              key={place.id}
                              id={`pickup-option-${index}`}
                              role="option"
                              aria-selected={pickupActiveIndex === index}
                              type="button"
                              className={`block w-full px-3 py-2 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted ${pickupActiveIndex === index ? "bg-muted" : ""}`}
                              onClick={() => selectPickup(place)}
                              onMouseEnter={() => setPickupActiveIndex(index)}
                            >
                              <span className="block text-sm font-medium">{place.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{place.address}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="relative group">
                      <Label htmlFor="destination" className="sr-only">Destination Location</Label>
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-foreground/40 transition-colors group-focus-within:text-accent-foreground" />
                      <Input
                        id="destination"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={dropoffSuggestions.length > 0}
                        aria-haspopup="listbox"
                        aria-controls="destination-suggestions"
                        aria-activedescendant={dropoffActiveIndex >= 0 ? `dropoff-option-${dropoffActiveIndex}` : undefined}
                        value={dropoffLocation}
                        onChange={(event) => updateDropoffLocation(event.target.value)}
                        onKeyDown={handleDropoffKeyDown}
                        placeholder="Destination"
                        className="pl-10 h-12 bg-muted/30 border-none focus-visible:ring-primary/30"
                      />
                      {dropoffSuggestions.length > 0 ? (
                        <div id="destination-suggestions" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-lg">
                          {dropoffSuggestions.map((place, index) => (
                            <button
                              key={place.id}
                              id={`dropoff-option-${index}`}
                              role="option"
                              aria-selected={dropoffActiveIndex === index}
                              type="button"
                              className={`block w-full px-3 py-2 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted ${dropoffActiveIndex === index ? "bg-muted" : ""}`}
                              onClick={() => selectDropoff(place)}
                              onMouseEnter={() => setDropoffActiveIndex(index)}
                            >
                              <span className="block text-sm font-medium">{place.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{place.address}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {(pickupPlace || dropoffPlace) ? (
                      <div className="grid gap-2 text-xs text-muted-foreground">
                        {pickupPlace ? <p>Pickup selected: {pickupPlace.address}</p> : null}
                        {dropoffPlace ? <p>Destination selected: {dropoffPlace.address}</p> : null}
                      </div>
                    ) : null}
                    <GlassSurface variant="premium" className="p-4 border-none bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Fare estimate</span></div>
                        <span className="text-lg font-bold" aria-live="polite">
                          {isEstimating ? (
                            <span className="text-sm font-normal text-muted-foreground animate-pulse">Calculating...</span>
                          ) : estimate ? (
                            `${estimate.currency} ${estimate.fare.toLocaleString()}`
                          ) : (
                            "Enter trip"
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Estimated on a {estimate?.distance ?? distanceKm(pickupPlace, dropoffPlace)} km city ride</div>
                    </GlassSurface>

                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-destructive font-medium"
                          role="alert"
                        >
                          {error}
                        </motion.div>
                      )}
                      {status && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-primary font-medium"
                        >
                          {status}
                        </motion.div>
                      )}
                      {safetyCode && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary"
                        >
                          Safety code: {safetyCode}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button size="xl" className="w-full mt-4 h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Confirming...
                        </div>
                      ) : "Confirm Booking"}
                    </Button>
                  </form>
                </CardContent></Card>
              <Card className="bg-primary/5 border-none shadow-none"><CardContent className="p-4 flex items-center gap-4"><Shield className="h-5 w-5 text-primary" /><BodyMd className="text-xs">Your safety is our priority. Trips are tracked and insured.</BodyMd></CardContent></Card>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-3">
              <Card className="h-full min-h-[420px] overflow-hidden border-none shadow-sm sm:min-h-[460px]">
                <div className="relative h-full min-h-[420px] sm:min-h-[460px]">
                  <PlacesBookingMap
                    places={mapPlaces}
                    pickupPlace={pickupPlace}
                    dropoffPlace={dropoffPlace}
                    onSelectPickup={selectPickup}
                    onSelectDropoff={selectDropoff}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] rounded-[1.4rem] border border-white/70 bg-background/90 px-4 py-3 shadow-[0_18px_40px_rgba(0,33,20,0.12)] backdrop-blur-xl sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-[1.6rem]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <BodyMd className="text-sm font-semibold">
                      {pickupLocation && dropoffLocation ? `${pickupLocation} to ${dropoffLocation}` : "Choose pickup and destination"}
                      </BodyMd>
                      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1">
                          {estimate?.distance ?? distanceKm(pickupPlace, dropoffPlace)} km
                        </span>
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-foreground">
                          {estimate ? `${estimate.currency} ${estimate.fare.toLocaleString()}` : "Live estimate"}
                        </span>
                      </div>
                    </div>
                    {pickupPlace && dropoffPlace ? (
                      <BodyMd className="mt-2 text-xs text-muted-foreground">
                        Route uses saved places: {pickupPlace.lat.toFixed(4)}, {pickupPlace.lng.toFixed(4)} to {dropoffPlace.lat.toFixed(4)}, {dropoffPlace.lng.toFixed(4)}
                      </BodyMd>
                    ) : (
                      <BodyMd className="mt-2 text-xs text-muted-foreground">
                        Search above or tap a saved place marker on the map.
                      </BodyMd>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
