"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { apiUrl } from "@/lib/auth"

type PublicTrip = {
  id: string
  status: string
  isLive: boolean
  pickup: { label: string; lat: number | null; lng: number | null }
  dropoff: { label: string; lat: number | null; lng: number | null }
  requestedAt: string
  acceptedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  rider: { name: string } | null
  driver: { name: string; rating: number | null; location: { lat: number | null; lng: number | null } | null } | null
  vehicle: { plate: string; description: string } | null
}

const REFRESH_MS = 10_000

export default function PublicTripSharePage() {
  const params = useParams<{ code: string }>()
  const code = params?.code
  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    if (!code) return
    try {
      const response = await fetch(`${apiUrl}/trips/share/${encodeURIComponent(code)}`)
      if (response.status === 404) {
        setError("This trip share link is invalid or has expired.")
        return
      }
      if (!response.ok) throw new Error(`Failed (${response.status})`)
      const data = (await response.json()) as PublicTrip
      setTrip(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trip")
    }
  }, [code])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!trip?.isLive) return
    const id = window.setInterval(load, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [trip?.isLive, load])

  if (error) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center p-6 bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to load trip</CardTitle>
          </CardHeader>
          <CardContent>
            <BodyMd className="text-muted-foreground">{error}</BodyMd>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!trip) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center p-6 bg-background">
        <BodyMd className="text-muted-foreground">Loading trip…</BodyMd>
      </main>
    )
  }

  const driverLoc = trip.driver?.location
  const hasDriverPin = trip.isLive && driverLoc && driverLoc.lat != null && driverLoc.lng != null

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <HeadingMd className="text-2xl">Noori Trip</HeadingMd>
            <BodyMd className="text-muted-foreground">
              {trip.rider?.name ? `${trip.rider.name}'s trip · ` : ""}Shared via safety code
            </BodyMd>
          </div>
          <Badge variant={trip.isLive ? "default" : "secondary"}>
            {trip.isLive ? "LIVE" : trip.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Pickup</p>
              <p className="font-medium">{trip.pickup.label}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Dropoff</p>
              <p className="font-medium">{trip.dropoff.label}</p>
            </div>
            {trip.requestedAt ? (
              <p className="text-xs text-muted-foreground">
                Requested at {new Date(trip.requestedAt).toLocaleString()}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {trip.driver ? (
          <Card>
            <CardHeader>
              <CardTitle>Driver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{trip.driver.name}</p>
              {trip.driver.rating != null ? (
                <p className="text-sm text-muted-foreground">★ {trip.driver.rating.toFixed(1)}</p>
              ) : null}
              {trip.vehicle ? (
                <p className="text-sm text-muted-foreground">
                  {trip.vehicle.description || "Vehicle"} · {trip.vehicle.plate}
                </p>
              ) : null}
              {hasDriverPin ? (
                <p className="text-xs text-muted-foreground">
                  Last known location: {driverLoc!.lat!.toFixed(5)}, {driverLoc!.lng!.toFixed(5)}
                </p>
              ) : trip.isLive ? (
                <p className="text-xs text-muted-foreground">Waiting for driver location…</p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <BodyMd className="text-muted-foreground">Driver not assigned yet.</BodyMd>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {trip.isLive
                ? `Auto-refreshing every ${REFRESH_MS / 1000}s. `
                : "Trip has ended. "}
              {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}.` : null}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Only the rider and authorized staff can view sensitive trip details. If this looks
              wrong, contact Noori support.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
