"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authedFetch } from "@/lib/auth"
import { Activity, Award, Gift, RefreshCw, TrendingUp, Users } from "lucide-react"

type LoyaltySummary = {
  totals: {
    enrolled: number
    currentPoints: number
    lifetimePoints: number
    rewardsClaimed: number
  }
  tiers: Array<{
    tier: string
    members: number
    currentPoints: number
    lifetimePoints: number
  }>
  recentTransactions: Array<{
    id: string
    type: "CREDIT" | "DEBIT"
    amount: number
    description?: string | null
    createdAt: string
    user: {
      id: string
      name?: string | null
      phone?: string | null
      role: string
    }
    account: {
      id: string
      tier: string
      points: number
      lifetime: number
    }
  }>
}

const tierOrder = ["NOORI", "BRONZE", "SILVER", "GOLD", "PLATINUM"]

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function userLabel(user: LoyaltySummary["recentTransactions"][number]["user"]) {
  return user.name || user.phone || user.id.slice(0, 8)
}

export default function LoyaltyAdminPage() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const tiers = useMemo(() => {
    const byTier = new Map(summary?.tiers.map((tier) => [tier.tier, tier]) ?? [])
    return tierOrder.map((tier) => byTier.get(tier) ?? { tier, members: 0, currentPoints: 0, lifetimePoints: 0 })
  }, [summary])

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const response = await authedFetch("/loyalty/admin/summary")
      if (!response.ok) throw new Error(`Failed to load loyalty summary (${response.status})`)
      setSummary(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loyalty summary")
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
                <Award className="h-6 w-6 text-primary" />
                Loyalty Program
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real loyalty balances, tier distribution, and recent point activity.
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
                  <Users className="h-4 w-4" />
                  Enrolled Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{loading ? "..." : formatNumber(summary?.totals.enrolled ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Current Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{loading ? "..." : formatNumber(summary?.totals.currentPoints ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Lifetime Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{loading ? "..." : formatNumber(summary?.totals.lifetimePoints ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  Rewards Claimed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{loading ? "..." : formatNumber(summary?.totals.rewardsClaimed ?? 0)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Recent Point Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading transactions...</p>
                ) : summary?.recentTransactions.length ? (
                  <div className="divide-y rounded-lg border">
                    {summary.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{transaction.description || (transaction.type === "CREDIT" ? "Points credited" : "Reward redeemed")}</p>
                            <Badge variant={transaction.type === "CREDIT" ? "default" : "secondary"}>{transaction.type}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {userLabel(transaction.user)} · {transaction.account.tier}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className={`font-semibold ${transaction.amount < 0 ? "text-destructive" : "text-primary"}`}>
                            {transaction.amount > 0 ? "+" : ""}
                            {formatNumber(transaction.amount)} pts
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                    No loyalty transactions yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tiers.map((tier) => (
                  <div key={tier.tier} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{tier.tier}</p>
                      <Badge variant={tier.members ? "default" : "secondary"}>{formatNumber(tier.members)}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Current: {formatNumber(tier.currentPoints)}</span>
                      <span>Lifetime: {formatNumber(tier.lifetimePoints)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
