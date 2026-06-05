"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"
import { PlaneTakeoff, Users, ListOrdered, Clock, PlaneLanding, Building2, Loader2 } from "lucide-react"

type Airport = {
  id: string
  name: string
  iataCode: string
  zones: Array<{
    id: string
    name: string
    type: string
  }>
}

type AirportAnalytics = {
  driversInQueue: number
  assignedToday: number
  upcomingFlightsNext2Hours: number
  averageWaitTimeMins: number
}

type AirportQueueEntry = {
  id: string
  entryTime: string
  zone: {
    name: string
    type: string
  }
  driver?: {
    user?: {
      name?: string | null
      phone?: string | null
    } | null
  } | null
  vehicle?: {
    plateNumber?: string | null
    make?: string | null
    model?: string | null
  } | null
}

type Flight = {
  id: string
  flightNumber: string
  airline: string
  arrivalTime: string
  status: string
}

const EMPTY_ANALYTICS: AirportAnalytics = {
  driversInQueue: 0,
  assignedToday: 0,
  upcomingFlightsNext2Hours: 0,
  averageWaitTimeMins: 0,
}

export default function AirportDashboardPage() {
  const [airports, setAirports] = useState<Airport[]>([])
  const [selectedAirportId, setSelectedAirportId] = useState("")
  const [analytics, setAnalytics] = useState<AirportAnalytics>(EMPTY_ANALYTICS)
  const [queue, setQueue] = useState<AirportQueueEntry[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAirport = useMemo(
    () => airports.find((airport) => airport.id === selectedAirportId) ?? null,
    [airports, selectedAirportId],
  )

  useEffect(() => {
    let cancelled = false

    async function loadAirports() {
      setLoading(true)
      try {
        const response = await authedFetch("/admin/airports")
        if (!response.ok) throw new Error(`Failed to load airports (${response.status})`)
        const data = (await response.json()) as Airport[]
        if (cancelled) return

        setAirports(data)
        setSelectedAirportId((current) => current || data[0]?.id || "")
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load airports")
          setAirports([])
          setSelectedAirportId("")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadAirports()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedAirportId) {
      setAnalytics(EMPTY_ANALYTICS)
      setQueue([])
      setFlights([])
      return
    }

    let cancelled = false

    async function loadAirportDetails() {
      setDetailsLoading(true)
      try {
        const [analyticsResponse, queueResponse, flightsResponse] = await Promise.all([
          authedFetch(`/admin/airports/${selectedAirportId}/analytics`),
          authedFetch(`/admin/airports/${selectedAirportId}/queue`),
          authedFetch(`/admin/airports/${selectedAirportId}/flights`),
        ])

        if (!analyticsResponse.ok || !queueResponse.ok || !flightsResponse.ok) {
          throw new Error("Failed to load airport operational data")
        }

        const [analyticsData, queueData, flightsData] = await Promise.all([
          analyticsResponse.json() as Promise<AirportAnalytics>,
          queueResponse.json() as Promise<AirportQueueEntry[]>,
          flightsResponse.json() as Promise<Flight[]>,
        ])

        if (cancelled) return

        setAnalytics(analyticsData)
        setQueue(queueData)
        setFlights(flightsData)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load airport data")
          setAnalytics(EMPTY_ANALYTICS)
          setQueue([])
          setFlights([])
        }
      } finally {
        if (!cancelled) setDetailsLoading(false)
      }
    }

    void loadAirportDetails()
    return () => {
      cancelled = true
    }
  }, [selectedAirportId])

  const airportStats = [
    { label: "Drivers in Queue", value: analytics.driversInQueue.toLocaleString(), icon: ListOrdered, color: "text-blue-500" },
    { label: "Assignments Today", value: analytics.assignedToday.toLocaleString(), icon: Users, color: "text-green-500" },
    { label: "Upcoming Flights (2h)", value: analytics.upcomingFlightsNext2Hours.toLocaleString(), icon: PlaneLanding, color: "text-orange-500" },
    { label: "Avg Wait Time", value: `${analytics.averageWaitTimeMins}m`, icon: Clock, color: "text-primary" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <PlaneTakeoff className="h-8 w-8 text-primary" />
                Airport Operations Hub
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage automated driver staging, FIFO queues, and VIP flight pickups.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <select
                className="bg-background border border-primary/20 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-primary/50"
                value={selectedAirportId}
                onChange={(event) => setSelectedAirportId(event.target.value)}
                disabled={loading || airports.length === 0}
              >
                {airports.length === 0 ? <option value="">No airports configured</option> : null}
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.name} ({airport.iataCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <Card className="mb-8 border-destructive/40 bg-destructive/10">
              <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-destructive">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Card className="glass-premium mb-8">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading airport operations...
              </CardContent>
            </Card>
          ) : null}

          {!loading && airports.length === 0 ? (
            <Card className="glass-premium mb-8 border-primary/10">
              <CardContent className="flex flex-col gap-3 p-8">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-xl font-black">No airport operations configured</h2>
                    <p className="text-sm text-muted-foreground">
                      The backend is live, but this environment does not have any airport records yet.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Once airports, queue zones, and flights are added, this dashboard will show real queue pressure, flight arrivals, and daily assignment activity.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {airportStats.map((stat, i) => (
              <Card className="glass-premium border-primary/10 group h-full" key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors ${stat.color}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{detailsLoading && selectedAirport ? "..." : stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-premium">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-primary" /> Live Queue Status
                </CardTitle>
                {selectedAirport ? <Badge variant="secondary">{selectedAirport.zones.length} zones</Badge> : null}
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-primary/20 p-6 text-sm text-muted-foreground">
                    No waiting drivers are currently in the queue for this airport.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queue.map((entry, index) => (
                      <div key={entry.id} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-muted-foreground/30 w-8">#{index + 1}</div>
                        <div>
                          <p className="font-bold text-sm">
                            {entry.driver?.user?.name ?? entry.driver?.user?.phone ?? "Unknown driver"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.zone.name} • {entry.vehicle?.plateNumber ?? "No vehicle assigned"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        Wait: {Math.max(0, Math.floor((Date.now() - new Date(entry.entryTime).getTime()) / 60000))}m
                      </span>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlaneLanding className="h-5 w-5 text-orange-500" /> Incoming Flights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flights.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-primary/20 p-6 text-sm text-muted-foreground">
                    No scheduled or delayed inbound flights are available for this airport right now.
                  </div>
                ) : (
                  <div className="space-y-4">
                  {flights.map((flight) => (
                    <div key={flight.id} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-bold text-sm">{flight.flightNumber} - {flight.airline}</p>
                        <p className="text-xs text-muted-foreground">Arrival tracking is live from the operations backend.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{new Date(flight.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <span className={`text-[10px] font-bold ${flight.status === 'DELAYED' ? 'text-red-500' : 'text-green-500'}`}>
                          {flight.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
