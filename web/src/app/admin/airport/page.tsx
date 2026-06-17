"use client"

import { useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plane, MapPin, Plus, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"

type Airport = {
  id: string
  name: string
  iataCode: string
  zones?: { id: string; name: string; type: string }[]
}

type AirportAnalytics = {
  driversInQueue: number
  assignedToday: number
  upcomingFlightsNext2Hours: number
  averageWaitTimeMins: number
}

type QueueEntry = {
  id: string
  zone?: { name?: string; type?: string } | null
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
  vehicle?: { plateNumber?: string | null; make?: string | null; model?: string | null } | null
}

type Flight = {
  id: string
  flightNumber: string
  airline: string
  arrivalTime: string
  status: string
}

export default function AirportAdminPage() {
  const [airports, setAirports] = useState<Airport[]>([])
  const [selectedAirportId, setSelectedAirportId] = useState("")
  const [analytics, setAnalytics] = useState<AirportAnalytics | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAirports() {
      setLoading(true)
      const res = await authedFetch("/admin/airports")
      const data = res.ok ? await res.json() : []
      setAirports(data)
      setSelectedAirportId(data[0]?.id ?? "")
      setLoading(false)
    }
    void loadAirports()
  }, [])

  useEffect(() => {
    if (!selectedAirportId) return
    async function loadAirportDetails() {
      const [analyticsRes, queueRes, flightsRes] = await Promise.all([
        authedFetch(`/admin/airports/${selectedAirportId}/analytics`),
        authedFetch(`/admin/airports/${selectedAirportId}/queue`),
        authedFetch(`/admin/airports/${selectedAirportId}/flights`),
      ])
      setAnalytics(analyticsRes.ok ? await analyticsRes.json() : null)
      setQueue(queueRes.ok ? await queueRes.json() : [])
      setFlights(flightsRes.ok ? await flightsRes.json() : [])
    }
    void loadAirportDetails()
  }, [selectedAirportId])

  const selectedAirport = airports.find((airport) => airport.id === selectedAirportId)

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Airport Operations"
            subtitle="Manage airport locations, specialized fleet queues, and transit logistics."
            actions={
              <Button className="font-black uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" /> Add Terminal
              </Button>
            }
          />

          {loading ? (
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="py-10 text-center text-muted-foreground">Loading airport operations...</CardContent>
            </Card>
          ) : airports.length === 0 ? (
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="py-10 text-center">
                <h2 className="text-xl font-black">No airport operations configured</h2>
                <p className="mt-2 text-muted-foreground">Noori does not have any airport records yet.</p>
                <select disabled className="mt-4 h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option>No airports</option>
                </select>
              </CardContent>
            </Card>
          ) : (
            <>
              <select
                aria-label="Airport"
                value={selectedAirportId}
                onChange={(event) => setSelectedAirportId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>{airport.name} ({airport.iataCode})</option>
                ))}
              </select>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-primary/10 glass-premium"><CardContent className="p-6"><Users className="mb-2 h-5 w-5 text-primary" /><p className="text-2xl font-black">{analytics?.driversInQueue ?? 0}</p><p className="text-xs text-muted-foreground">Drivers in queue</p></CardContent></Card>
                <Card className="border-primary/10 glass-premium"><CardContent className="p-6"><p className="text-2xl font-black">{analytics?.assignedToday ?? 0}</p><p className="text-xs text-muted-foreground">Assigned today</p></CardContent></Card>
                <Card className="border-primary/10 glass-premium"><CardContent className="p-6"><Plane className="mb-2 h-5 w-5 text-primary" /><p className="text-2xl font-black">{analytics?.upcomingFlightsNext2Hours ?? 0}</p><p className="text-xs text-muted-foreground">Flights next 2 hours</p></CardContent></Card>
                <Card className="border-primary/10 glass-premium"><CardContent className="p-6"><Clock className="mb-2 h-5 w-5 text-primary" /><p className="text-2xl font-black">{analytics?.averageWaitTimeMins ?? 0}m</p><p className="text-xs text-muted-foreground">Average wait</p></CardContent></Card>
              </div>
            </>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" /> Active Terminals
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 text-center">
                {selectedAirport ? (
                  <div className="space-y-3 text-left">
                    {queue.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-primary/10 p-3">
                        <p className="font-bold">{entry.driver?.user?.name ?? entry.driver?.user?.phone ?? "Unknown driver"}</p>
                        <p className="text-sm text-muted-foreground">{entry.zone?.name ?? "Queue"} - {entry.vehicle?.plateNumber ?? "No vehicle"}</p>
                      </div>
                    ))}
                    {queue.length === 0 ? <p className="text-center text-muted-foreground">{selectedAirport.name} ({selectedAirport.iataCode}) has no waiting drivers.</p> : null}
                  </div>
                ) : <p className="text-muted-foreground">Kabul International (KBL) is the only active airport node.</p>}
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Pickup Points
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 text-center">
                {selectedAirport ? (
                  <div className="space-y-3 text-left">
                    {flights.map((flight) => (
                      <div key={flight.id} className="rounded-lg border border-primary/10 p-3">
                        <p className="font-bold">{flight.flightNumber} - {flight.airline}</p>
                        <p className="text-sm text-muted-foreground">{flight.status} - {new Date(flight.arrivalTime).toLocaleString()}</p>
                      </div>
                    ))}
                    {flights.length === 0 ? <p className="text-center text-muted-foreground">{selectedAirport.zones?.length ?? 0} pickup points configured.</p> : null}
                  </div>
                ) : <p className="text-muted-foreground">4 designated pickup bays configured for KBL.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
