"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authedFetch } from "@/lib/auth"
import { Car, ShieldCheck, Loader2, RefreshCw, ClipboardCheck, Wrench } from "lucide-react"

type Vehicle = {
  id: string
  type: string
  make?: string | null
  model?: string | null
  plateNumber: string
  color?: string | null
  capacity?: number | null
  isActive: boolean
  status?: string | null
  driver?: {
    user?: {
      name?: string | null
      phone?: string | null
    } | null
  } | null
  fleet?: {
    companyName?: string | null
  } | null
}

type Inspection = {
  id: string
  inspectionDate: string
  expiryDate?: string | null
  status: string
  notes?: string | null
  vehicle?: {
    plateNumber?: string | null
    type?: string | null
    make?: string | null
  } | null
  inspector?: {
    name?: string | null
  } | null
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return vehicles

    return vehicles.filter((vehicle) => {
      const haystack = [
        vehicle.plateNumber,
        vehicle.type,
        vehicle.make,
        vehicle.model,
        vehicle.status,
        vehicle.driver?.user?.name,
        vehicle.driver?.user?.phone,
        vehicle.fleet?.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [query, vehicles])

  const activeVehicles = vehicles.filter((vehicle) => vehicle.isActive && vehicle.status === "ACTIVE").length
  const maintenanceVehicles = vehicles.filter((vehicle) => vehicle.status === "MAINTENANCE").length

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const [vehiclesResponse, inspectionsResponse] = await Promise.all([
          authedFetch("/admin/vehicles"),
          authedFetch("/admin/vehicles/inspections"),
        ])

        if (!vehiclesResponse.ok || !inspectionsResponse.ok) {
          throw new Error("Failed to load vehicle operations data")
        }

        const [vehiclesData, inspectionsData] = await Promise.all([
          vehiclesResponse.json() as Promise<Vehicle[]>,
          inspectionsResponse.json() as Promise<Inspection[]>,
        ])

        if (cancelled) return
        setVehicles(vehiclesData)
        setInspections(inspectionsData)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setVehicles([])
          setInspections([])
          setError(err instanceof Error ? err.message : "Failed to load vehicles")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Car className="h-8 w-8 text-primary" />
                Vehicle Management
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage vehicle registry, categories, and inspection status.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {error ? (
            <Card className="mb-6 border-destructive/40 bg-destructive/10">
              <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-destructive">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
            <Card className="glass-premium">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Registered Vehicles</p>
                  <p className="text-3xl font-black">{loading ? "..." : vehicles.length}</p>
                </div>
                <Car className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>
            <Card className="glass-premium">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Active Fleet</p>
                  <p className="text-3xl font-black">{loading ? "..." : activeVehicles}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </CardContent>
            </Card>
            <Card className="glass-premium">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Inspection Records</p>
                  <p className="text-3xl font-black">{loading ? "..." : inspections.length}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-orange-500" />
              </CardContent>
            </Card>
          </div>

          <Card className="glass-premium mb-6">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Search vehicles</label>
                <Input
                  placeholder="Search by plate, driver, make, or status..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Vehicle creation and assignment are currently managed through driver onboarding flows.
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium">
            <CardHeader>
              <CardTitle>Vehicle Registry</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Plate Number</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Make & Model</th>
                    <th className="px-6 py-4">Assigned Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Fleet</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-muted-foreground" colSpan={6}>
                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading vehicles...</span>
                      </td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-muted-foreground" colSpan={6}>
                        No vehicles matched the current filters.
                      </td>
                    </tr>
                  ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono font-black text-primary">{vehicle.plateNumber}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{vehicle.type}</Badge></td>
                      <td className="px-6 py-4 font-bold">{[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Unknown vehicle"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{vehicle.driver?.user?.name ?? vehicle.driver?.user?.phone ?? "Unassigned"}</td>
                      <td className="px-6 py-4">
                        <Badge variant={vehicle.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                          {vehicle.status ?? (vehicle.isActive ? "ACTIVE" : "INACTIVE")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{vehicle.fleet?.companyName ?? "Independent"}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="glass-premium mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Inspections</CardTitle>
              <Badge variant="secondary">{maintenanceVehicles} in maintenance</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading inspection history...</div>
              ) : inspections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-primary/20 p-6 text-sm text-muted-foreground">
                  No inspection records have been logged yet. Inspection creation is supported by the backend, but this admin route currently surfaces read-only operational data.
                </div>
              ) : (
                <div className="space-y-4">
                  {inspections.slice(0, 5).map((inspection) => (
                    <div key={inspection.id} className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-bold">{inspection.vehicle?.plateNumber ?? "Unknown plate"}</p>
                        <p className="text-sm text-muted-foreground">
                          {[inspection.vehicle?.make, inspection.vehicle?.type].filter(Boolean).join(" • ") || "Vehicle inspection"}
                        </p>
                        {inspection.notes ? <p className="mt-1 text-xs text-muted-foreground">{inspection.notes}</p> : null}
                      </div>
                      <div className="text-right">
                        <Badge variant={inspection.status === "PASSED" ? "default" : "secondary"}>{inspection.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(inspection.inspectionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
