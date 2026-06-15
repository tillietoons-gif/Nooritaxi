"use client"

import { useState, useEffect } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, RefreshCw } from "lucide-react"
import { authedFetch } from "@/lib/auth"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

type Tier = {
  tier: string
  count: number
  averageRating: number
  completedTrips: number
}

export default function DriverTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await authedFetch("/admin/drivers/tiers")
        if (res.ok) setTiers(await res.json())
      } catch (err) {
        console.error(err)
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
            title="Performance Tiers"
            subtitle="Analyze driver distribution and requirements across loyalty levels."
            actions={
              <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <Card key={i} className="h-48 border-primary/10 animate-pulse bg-primary/5" />)
            ) : tiers.map(t => (
              <Card key={t.tier} className="border-primary/10 shadow-xl glass-premium hover:border-primary/30 transition-all group">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-xl tracking-tight uppercase mb-1">{t.tier}</h3>
                  <p className="text-3xl font-black text-foreground mb-4">{t.count}</p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <div className="p-1 rounded bg-background/50 border border-primary/5">Rating: {t.averageRating.toFixed(1)}</div>
                    <div className="p-1 rounded bg-background/50 border border-primary/5">Trips: {t.completedTrips}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
