"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
import { Activity, AlertTriangle, Ban, LoaderCircle, RefreshCw, ShieldAlert, Users, type LucideIcon } from "lucide-react"

type FraudDashboard = {
  totalAlerts: number
  openCases: number
  criticalRiskEntities: number
  trends: Record<string, number>
}

type FraudAlert = {
  id: string
  type: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  message: string
  isResolved: boolean
  createdAt: string
  user?: { name?: string | null; phone?: string | null } | null
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
}

type FraudCase = {
  id: string
  title: string
  status: string
  createdAt: string
  assignedTo?: { name?: string | null } | null
  targetUser?: { name?: string | null; phone?: string | null } | null
  targetDriver?: { user?: { name?: string | null } | null } | null
}

type RiskAccount = {
  id: string
  score: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  lastCalculatedAt: string
  user?: { name?: string | null; phone?: string | null } | null
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
}

type BlacklistEntry = {
  id: string
  type: string
  value: string
  reason: string
  createdAt: string
}

type StatCard = {
  label: string
  value: number
  icon: LucideIcon
  color: string
  href?: string
}

const EMPTY_DASHBOARD: FraudDashboard = {
  totalAlerts: 0,
  openCases: 0,
  criticalRiskEntities: 0,
  trends: {},
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

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function targetName(item: Pick<FraudAlert, "user" | "driver">) {
  return (
    item.user?.name ||
    item.user?.phone ||
    item.driver?.user?.name ||
    item.driver?.user?.phone ||
    "Unknown target"
  )
}

function caseTargetName(item: FraudCase) {
  return (
    item.targetUser?.name ||
    item.targetUser?.phone ||
    item.targetDriver?.user?.name ||
    item.assignedTo?.name ||
    "Unassigned target"
  )
}

function accountName(account: RiskAccount) {
  return (
    account.user?.name ||
    account.user?.phone ||
    account.driver?.user?.name ||
    account.driver?.user?.phone ||
    "Unknown account"
  )
}

function severityVariant(severity: FraudAlert["severity"]) {
  if (severity === "CRITICAL" || severity === "HIGH") return "destructive" as const
  if (severity === "MEDIUM") return "secondary" as const
  return "outline" as const
}

function statusVariant(status: string) {
  if (status === "OPEN" || status === "INVESTIGATING" || status === "ESCALATED") return "destructive" as const
  if (status === "RESOLVED" || status === "DISMISSED") return "secondary" as const
  return "outline" as const
}

function trendLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
}

export default function FraudDashboardPage() {
  const [dashboard, setDashboard] = useState<FraudDashboard>(EMPTY_DASHBOARD)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [cases, setCases] = useState<FraudCase[]>([])
  const [accounts, setAccounts] = useState<RiskAccount[]>([])
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const [dashboardResponse, alertsResponse, casesResponse, accountsResponse, blacklistResponse] = await Promise.all([
        authedFetch("/admin/fraud/dashboard"),
        authedFetch("/admin/fraud/alerts"),
        authedFetch("/admin/fraud/cases"),
        authedFetch("/admin/fraud/accounts"),
        authedFetch("/admin/fraud/blacklist"),
      ])

      if (!dashboardResponse.ok) throw new Error(await getErrorMessage(dashboardResponse))
      if (!alertsResponse.ok) throw new Error(await getErrorMessage(alertsResponse))
      if (!casesResponse.ok) throw new Error(await getErrorMessage(casesResponse))
      if (!accountsResponse.ok) throw new Error(await getErrorMessage(accountsResponse))
      if (!blacklistResponse.ok) throw new Error(await getErrorMessage(blacklistResponse))

      const [dashboardData, alertsData, casesData, accountsData, blacklistData] = await Promise.all([
        dashboardResponse.json() as Promise<FraudDashboard>,
        alertsResponse.json() as Promise<FraudAlert[]>,
        casesResponse.json() as Promise<FraudCase[]>,
        accountsResponse.json() as Promise<RiskAccount[]>,
        blacklistResponse.json() as Promise<BlacklistEntry[]>,
      ])

      setDashboard({ ...EMPTY_DASHBOARD, ...dashboardData, trends: dashboardData.trends ?? {} })
      setAlerts(Array.isArray(alertsData) ? alertsData : [])
      setCases(Array.isArray(casesData) ? casesData : [])
      setAccounts(Array.isArray(accountsData) ? accountsData : [])
      setBlacklist(Array.isArray(blacklistData) ? blacklistData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fraud operations")
      setDashboard(EMPTY_DASHBOARD)
      setAlerts([])
      setCases([])
      setAccounts([])
      setBlacklist([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const trendEntries = useMemo(
    () => Object.entries(dashboard.trends).filter(([, value]) => Number.isFinite(Number(value))),
    [dashboard.trends],
  )

  const maxTrendValue = useMemo(
    () => Math.max(1, ...trendEntries.map(([, value]) => Number(value))),
    [trendEntries],
  )

  const highPriorityAlerts = useMemo(
    () => alerts.filter((alert) => alert.severity === "CRITICAL" || alert.severity === "HIGH").slice(0, 6),
    [alerts],
  )

  const stats: StatCard[] = [
    { label: "Active Alerts", value: dashboard.totalAlerts, icon: AlertTriangle, color: "text-red-500", href: "/admin/fraud/alerts" },
    { label: "Open Cases", value: dashboard.openCases, icon: ShieldAlert, color: "text-orange-500" },
    { label: "Critical Risk Entities", value: dashboard.criticalRiskEntities, icon: Users, color: "text-purple-500" },
    { label: "Blacklist Entries", value: blacklist.length, icon: Ban, color: "text-primary" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-background/50">
        <Header />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <HeadingLg className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                  Fraud & Risk Operations Center
                </HeadingLg>
                <BodyMd className="text-muted-foreground">
                  Monitor suspicious activity, investigation cases, high-risk accounts, and blacklist coverage.
                </BodyMd>
              </div>
              <Button variant="outline" onClick={() => void loadData(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                const card = (
                  <Card className="glass-premium h-full border-red-500/10 transition-colors hover:border-red-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className={`h-4 w-4 ${stat.color}`} /> {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black">{loading ? "..." : stat.value.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                )

                return stat.href ? (
                  <Link href={stat.href} key={stat.label}>{card}</Link>
                ) : (
                  <div key={stat.label}>{card}</div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="glass-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Risk Trend Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading risk trends...
                    </div>
                  ) : trendEntries.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No trend analytics are available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trendEntries.map(([key, value]) => {
                        const numericValue = Number(value)
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium">{trendLabel(key)}</span>
                              <span className="font-mono text-muted-foreground">{numericValue.toLocaleString()}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${Math.max(8, (numericValue / maxTrendValue) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-premium">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" /> High-Priority Alerts
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Live alerts ranked by severity from the fraud engine.</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/fraud/alerts">View Alerts</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading alerts...
                    </div>
                  ) : highPriorityAlerts.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No high-priority fraud alerts are open.
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {highPriorityAlerts.map((alert) => (
                        <div key={alert.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{alert.type}</p>
                              <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{targetName(alert)} · {alert.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="glass-premium">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Investigation Cases</CardTitle>
                    <p className="text-sm text-muted-foreground">Recent case workload from the fraud case queue.</p>
                  </div>
                  <Badge variant="outline">{cases.length} cases</Badge>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading cases...
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No fraud cases are currently recorded.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cases.slice(0, 5).map((fraudCase) => (
                        <div key={fraudCase.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{fraudCase.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{caseTargetName(fraudCase)} · {formatDate(fraudCase.createdAt)}</p>
                            </div>
                            <Badge variant={statusVariant(fraudCase.status)}>{fraudCase.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-premium">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>High-Risk Accounts</CardTitle>
                    <p className="text-sm text-muted-foreground">Accounts currently classified as high or critical risk.</p>
                  </div>
                  <Badge variant="outline">{accounts.length} accounts</Badge>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading accounts...
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No high-risk accounts are currently recorded.
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {accounts.slice(0, 6).map((account) => (
                        <div key={account.id} className="flex items-center justify-between gap-3 p-4">
                          <div>
                            <p className="font-semibold">{accountName(account)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Last scored {formatDate(account.lastCalculatedAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={account.riskLevel === "CRITICAL" ? "destructive" : "secondary"}>{account.riskLevel}</Badge>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">Score {account.score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
