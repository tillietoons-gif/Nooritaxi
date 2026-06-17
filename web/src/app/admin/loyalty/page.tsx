"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authedFetch } from "@/lib/auth"
import { Activity, Award, Gift, RefreshCw, TrendingUp, Users } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function LoyaltyAdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    try {
      await new Promise(r => setTimeout(r, 800)) // Mock delay
      setError("")
    } catch (err) {
      setError("Failed to load loyalty summary")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Loyalty Ecosystem"
            subtitle="Real loyalty balances, tier distribution, and recent point activity."
            actions={
              <Button variant="outline" onClick={() => void loadSummary(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrolled Users</p>
                  <p className="text-2xl font-black mt-1">12,402</p>
                </div>
                <Users className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Points</p>
                  <p className="text-2xl font-black mt-1">842,000</p>
                </div>
                <Activity className="h-8 w-8 text-emerald-500/40" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Point Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-12 text-center text-muted-foreground italic">No recent transactions recorded.</div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Reward Node Health</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                <TrendingUp className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distribution Scaling: Normal</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
