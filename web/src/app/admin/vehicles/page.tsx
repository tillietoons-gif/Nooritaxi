"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Car, ShieldCheck, ClipboardCheck, RefreshCw, Loader2 } from "lucide-react"
import { authedFetch } from "@/lib/auth"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

type Vehicle = {
  id: string
  plateNumber: string
  type: string
  make?: string | null
  model?: string | null
  year?: number | null
  status?: string | null
  isActive: boolean
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
  fleet?: { companyName?: string | null } | null
}

type Inspection = {
  id: string
  vehicleId: string
  inspectorId: string
  status: string
  notes?: string | null
  inspectionDate: string
  vehicle?: Vehicle | null
}

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const search = query.toLowerCase()
      return (
        v.plateNumber.toLowerCase().includes(search) ||
        (v.make ?? "").toLowerCase().includes(search) ||
        (v.driver?.user?.name ?? "").toLowerCase().includes(search) ||
        (v.driver?.user?.phone ?? "").includes(search)
      )
    })
  }, [vehicles, query])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [vRes, iRes] = await Promise.all([
          authedFetch("/admin/vehicles"),
          authedFetch("/admin/vehicles/inspections")
        ])
        if (vRes.ok) setVehicles(await vRes.json())
        if (iRes.ok) setInspections(await iRes.json())
      } catch (err) {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Vehicle Operations"
            subtitle="Manage registry, categories, and technical compliance."
            actions={
              <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/10 glass-premium">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Registry</p>
                  <p className="mt-1 text-2xl font-black">{loading ? "..." : vehicles.length}</p>
                </div>
                <Car className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance Passed</p>
                  <p className="mt-1 text-2xl font-black">{loading ? "..." : inspections.filter(i => i.status === "PASSED").length}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-emerald-500/40" />
              </CardContent>
              </Card>
          </div>

          <Card className="border-primary/10 shadow-xl overflow-hidden glass-premium">
            <CardHeader className="bg-primary/5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Active Fleet</CardTitle>
                <Input
                  placeholder="Search by plate, driver..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="md:w-80 bg-background/50"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Plate</th>
                      <th className="px-6 py-4">Type / Model</th>
                      <th className="px-6 py-4">Assigned Driver</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center animate-pulse text-muted-foreground">Accessing vehicle database...</td></tr>
                    ) : filteredVehicles.map(v => (
                      <tr key={v.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors align-top">
                        <td className="px-6 py-4 font-mono font-black text-primary">{v.plateNumber}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{v.make} {v.model}</div>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground">{v.type}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-xs">{v.driver?.user?.name ?? v.driver?.user?.phone ?? "Unassigned"}</td>
                        <td className="px-6 py-4"><Badge variant={v.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] font-black">{v.status ?? "INACTIVE"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
