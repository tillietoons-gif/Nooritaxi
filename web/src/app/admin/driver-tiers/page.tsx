"use client"

import { useCallback, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authedFetch } from "@/lib/auth"
import { AlertTriangle, Car, RefreshCw, Route, Star, TrendingUp } from "lucide-react"

type TierSummary = {
  totals: {
    totalDrivers: number
    averageRating: number
    averageCompletedTrips: number
    averageCompletedDeliveries: number
    atRiskDrivers: number
  }
  configSource: "database" | "defaults"
  tiers: Array<{
    tier: string
    drivers: number
    minTrips: number
    minRating: number
    averageRating: number
    averageTrips: number
    completedTrips: number
    completedDeliveries: number
  }>
}

const tierStyles: Record<string, string> = {
  BRONZE: "border-orange-500/30 bg-orange-500/5",
  SILVER: "border-slate-400/40 bg-slate-400/10",
  GOLD: "border-yellow-500/40 bg-yellow-500/10",
  PLATINUM: "border-cyan-500/40 bg-cyan-500/10",
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export default function DriverTiersPage() {
  const [summary, setSummary] = useState<TierSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const response = await authedFetch("/driver-tiers/admin/summary")
      if (!response.ok) throw new Error(`Failed to load driver tiers (${response.status})`)
      setSummary(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver tiers")
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
      <main className="min-h-screen bg-muted/20 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <TrendingUp className="h-6 w-6 text-primary" />
                Driver Tiers
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real driver distribution, performance, and tier requirements.
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadSummary(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Network Avg Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {loading ? "..." : formatNumber(summary?.totals.averageRating ?? 0, 2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Route className="h-4 w-4" />
                  Avg Completed Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {loading ? "..." : formatNumber(summary?.totals.averageCompletedTrips ?? 0, 1)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Car className="h-4 w-4" />
                  Total Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {loading ? "..." : formatNumber(summary?.totals.totalDrivers ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-destructive">
                  {loading ? "..." : formatNumber(summary?.totals.atRiskDrivers ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Rating below 4.5</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Tier Distribution & Requirements</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary?.configSource === "database"
                    ? "Requirements are loaded from DriverTierConfig."
                    : "Using fallback requirements because no DriverTierConfig rows exist yet."}
                </p>
              </div>
              {summary ? <Badge variant="secondary">{summary.configSource}</Badge> : null}
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading tier distribution...</p>
              ) : summary?.tiers.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summary.tiers.map((tier) => (
                    <div key={tier.tier} className={`rounded-lg border p-4 ${tierStyles[tier.tier] ?? ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{tier.tier}</h3>
                        <Badge variant={tier.drivers ? "default" : "secondary"}>
                          {formatNumber(tier.drivers)} drivers
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm">
                        <div className="flex justify-between rounded-md bg-background/70 px-3 py-2">
                          <span className="text-muted-foreground">Min trips</span>
                          <span className="font-medium">{formatNumber(tier.minTrips)}</span>
                        </div>
                        <div className="flex justify-between rounded-md bg-background/70 px-3 py-2">
                          <span className="text-muted-foreground">Min rating</span>
                          <span className="font-medium">{formatNumber(tier.minRating, 2)}</span>
                        </div>
                        <div className="flex justify-between rounded-md bg-background/70 px-3 py-2">
                          <span className="text-muted-foreground">Avg rating</span>
                          <span className="font-medium">{formatNumber(tier.averageRating, 2)}</span>
                        </div>
                        <div className="flex justify-between rounded-md bg-background/70 px-3 py-2">
                          <span className="text-muted-foreground">Total trips</span>
                          <span className="font-medium">{formatNumber(tier.completedTrips)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                  No driver tier data found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
