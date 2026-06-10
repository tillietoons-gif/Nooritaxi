"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authedFetch } from "@/lib/auth"
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Award,
  Gift,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react"

type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"
type LoyaltyTransactionType = "CREDIT" | "DEBIT"

type LoyaltySummary = {
  totals: {
    enrolled: number
    currentPoints: number
    lifetimePoints: number
    rewardsClaimed: number
  }
  tiers: Array<{
    tier: LoyaltyTier
    members: number
    currentPoints: number
    lifetimePoints: number
  }>
  recentTransactions: Array<{
    id: string
    type: LoyaltyTransactionType
    amount: number
    description: string
    createdAt: string
    user?: {
      id: string
      name?: string | null
      phone?: string | null
      role?: string | null
    } | null
    account: {
      id: string
      tier: LoyaltyTier
      points: number
      lifetime: number
    }
  }>
}

const EMPTY_SUMMARY: LoyaltySummary = {
  totals: {
    enrolled: 0,
    currentPoints: 0,
    lifetimePoints: 0,
    rewardsClaimed: 0,
  },
  tiers: [],
  recentTransactions: [],
}

const TIER_ORDER: LoyaltyTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"]

function formatNumber(value: number) {
  return value.toLocaleString()
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function transactionLabel(transaction: LoyaltySummary["recentTransactions"][number]) {
  return transaction.user?.name || transaction.user?.phone || "Unknown member"
}

function transactionAmount(transaction: LoyaltySummary["recentTransactions"][number]) {
  return `${transaction.type === "CREDIT" ? "+" : "-"}${formatNumber(Math.abs(transaction.amount))} pts`
}

function tierTone(tier: LoyaltyTier) {
  if (tier === "PLATINUM") return "bg-primary text-primary-foreground"
  if (tier === "GOLD") return "border border-accent/40 bg-accent/20 text-foreground"
  if (tier === "SILVER") return "border border-slate-300 bg-slate-100 text-slate-700"
  return "bg-secondary text-secondary-foreground"
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(payload.message)) return payload.message.join(", ")
    if (payload.message) return payload.message
  } catch {
    // Ignore invalid JSON responses.
  }

  return `Request failed with ${response.status}`
}

export default function LoyaltyAdminPage() {
  const [summary, setSummary] = useState<LoyaltySummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)

    try {
      const response = await authedFetch("/loyalty/admin/summary")
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const payload = (await response.json()) as LoyaltySummary
      setSummary({
        totals: payload?.totals ?? EMPTY_SUMMARY.totals,
        tiers: Array.isArray(payload?.tiers) ? payload.tiers : [],
        recentTransactions: Array.isArray(payload?.recentTransactions) ? payload.recentTransactions : [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loyalty summary")
      setSummary(EMPTY_SUMMARY)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const tierRows = useMemo(() => {
    const byTier = new Map(summary.tiers.map((tier) => [tier.tier, tier]))
    return TIER_ORDER.map((tier) => byTier.get(tier) ?? { tier, members: 0, currentPoints: 0, lifetimePoints: 0 })
  }, [summary.tiers])

  const topTier = useMemo(() => {
    return tierRows.reduce<(typeof tierRows)[number] | null>((highest, row) => {
      if (!highest || row.members > highest.members) return row
      return highest
    }, null)
  }, [tierRows])

  const creditCount = useMemo(
    () => summary.recentTransactions.filter((transaction) => transaction.type === "CREDIT").length,
    [summary.recentTransactions],
  )

  const debitCount = useMemo(
    () => summary.recentTransactions.filter((transaction) => transaction.type === "DEBIT").length,
    [summary.recentTransactions],
  )

  const healthLabel = summary.totals.enrolled
    ? summary.totals.rewardsClaimed > summary.totals.enrolled / 2
      ? "High redemption velocity"
      : creditCount >= debitCount
        ? "Healthy accrual momentum"
        : "Redemption-heavy cycle"
    : "Awaiting enrollment"

  const hasData =
    summary.totals.enrolled > 0 || summary.recentTransactions.length > 0 || summary.tiers.some((tier) => tier.members > 0)

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Loyalty Ecosystem"
            subtitle="Track enrollment, tier distribution, and recent point activity across the Noori rewards network."
            actions={
              <Button variant="outline" onClick={() => void loadSummary(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrolled Users</p>
                  <p className="mt-1 text-2xl font-black">{formatNumber(summary.totals.enrolled)}</p>
                </div>
                <Users className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Points</p>
                  <p className="mt-1 text-2xl font-black">{formatNumber(summary.totals.currentPoints)}</p>
                </div>
                <Activity className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifetime Points</p>
                  <p className="mt-1 text-2xl font-black">{formatNumber(summary.totals.lifetimePoints)}</p>
                </div>
                <Award className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium shadow-xl">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rewards Claimed</p>
                  <p className="mt-1 text-2xl font-black">{formatNumber(summary.totals.rewardsClaimed)}</p>
                </div>
                <Gift className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card className="overflow-hidden border-primary/10 shadow-2xl glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Point Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="px-6 py-14 text-center text-muted-foreground">
                    <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-primary/50" />
                    <p className="text-xs font-black uppercase tracking-widest">Synchronizing loyalty activity...</p>
                  </div>
                ) : summary.recentTransactions.length ? (
                  <div className="divide-y divide-primary/5">
                    {summary.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-bold tracking-tight">{transactionLabel(transaction)}</p>
                            <Badge
                              variant={transaction.type === "CREDIT" ? "default" : "secondary"}
                              className="text-[10px] font-black uppercase tracking-wider"
                            >
                              {transaction.type}
                            </Badge>
                            <Badge className={`${tierTone(transaction.account.tier)} text-[10px] font-black uppercase tracking-wider`}>
                              {transaction.account.tier}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatDate(transaction.createdAt)}</span>
                            <span>Balance: {formatNumber(transaction.account.points)} pts</span>
                            <span>Lifetime: {formatNumber(transaction.account.lifetime)} pts</span>
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <p className={`text-base font-black ${transaction.type === "CREDIT" ? "text-primary" : "text-foreground"}`}>
                            {transactionAmount(transaction)}
                          </p>
                          <p className="text-xs text-muted-foreground">{transaction.user?.role ?? "USER"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-muted-foreground italic">No recent loyalty transactions recorded.</div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden border-primary/10 shadow-2xl glass-premium">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Reward Node Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">System Pulse</p>
                      <p className="mt-1 text-base font-bold">{healthLabel}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-2xl border border-primary/10 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">Credit events</span>
                        <span className="font-black text-primary">{creditCount}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">Redemption events</span>
                        <span className="font-black">{debitCount}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">Largest tier</span>
                        <span className="font-black">{topTier?.tier ?? "BRONZE"}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {topTier ? `${formatNumber(topTier.members)} members currently anchored here.` : "No tier members yet."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-primary/10 shadow-2xl glass-premium">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Tier Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {tierRows.map((tier) => (
                    <div key={tier.tier} className="rounded-2xl border border-primary/10 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${tierTone(tier.tier)} font-black uppercase tracking-wider`}>{tier.tier}</Badge>
                          {topTier?.tier === tier.tier && tier.members > 0 ? <ArrowUpRight className="h-4 w-4 text-primary" /> : null}
                        </div>
                        <span className="text-sm font-black">{formatNumber(tier.members)} members</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span>Current points: {formatNumber(tier.currentPoints)}</span>
                        <span>Lifetime points: {formatNumber(tier.lifetimePoints)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {!loading && !error && !hasData ? (
            <Card className="border-dashed border-primary/20">
              <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <Trophy className="mb-4 h-12 w-12 text-primary/30" />
                <p className="text-base font-bold">No loyalty activity yet</p>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Loyalty accounts will appear here once riders begin earning or redeeming points through trips and rewards.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {!loading && !error && hasData ? (
            <Card className="border-primary/10">
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Accrual trend</p>
                    <p className="text-sm text-muted-foreground">
                      Lifetime issuance is at {formatNumber(summary.totals.lifetimePoints)} points across the network.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Reward flow</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(summary.totals.rewardsClaimed)} redeemed events have been recorded so far.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Operational note</p>
                    <p className="text-sm text-muted-foreground">
                      This screen is live-data backed; if counts look flat, check whether trips are awarding loyalty in the current environment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </AuthGate>
  )
}
