"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingLg } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
import { Activity, BellRing, Car, Crosshair, LoaderCircle, Map, Megaphone, Network, PhoneCall, RefreshCw, ShieldAlert, Users, type LucideIcon } from "lucide-react"

type OperationsMetrics = {
  activeDrivers: number
  activeTrips: number
  pendingTrips: number
  sosAlerts: number
  openIncidents: number
  activeRiders: number
  revenueToday: number
  tripCompletionRate: number
  cancellationRate: number
}

type Incident = {
  id: string
  type: string
  status: string
  title: string
  description?: string | null
  createdAt: string
  assignedTo?: { name?: string | null } | null
  trip?: { id: string; pickupLocation?: string | null; dropoffLocation?: string | null } | null
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
  user?: { name?: string | null; phone?: string | null } | null
}

type SosAlert = {
  id: string
  status: string
  message?: string | null
  lat?: number | null
  lng?: number | null
  tripId?: string | null
  createdAt: string
  user?: { name?: string | null; phone?: string | null } | null
}

type MetricCard = {
  label: string
  value: string
  color: string
  icon: LucideIcon
}

type OperationsModuleCard = {
  label: string
  icon: LucideIcon
  desc: string
  href?: string
}

const EMPTY_METRICS: OperationsMetrics = {
  activeDrivers: 0,
  activeTrips: 0,
  pendingTrips: 0,
  sosAlerts: 0,
  openIncidents: 0,
  activeRiders: 0,
  revenueToday: 0,
  tripCompletionRate: 0,
  cancellationRate: 0,
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

function formatNumber(value: number) {
  return value.toLocaleString()
}

function formatMoney(value: number) {
  return `AFN ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function incidentActor(incident: Incident) {
  return (
    incident.driver?.user?.name ||
    incident.driver?.user?.phone ||
    incident.user?.name ||
    incident.user?.phone ||
    incident.assignedTo?.name ||
    "Unassigned"
  )
}

function statusVariant(status: string) {
  if (status === "OPEN" || status === "ACTIVE") return "destructive" as const
  if (status === "RESOLVED" || status === "CLOSED" || status === "CANCELLED") return "secondary" as const
  return "outline" as const
}

export default function OCCDashboardPage() {
  const [metrics, setMetrics] = useState<OperationsMetrics>(EMPTY_METRICS)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const [metricsResponse, incidentsResponse, sosResponse] = await Promise.all([
        authedFetch("/admin/operations/dashboard"),
        authedFetch("/admin/operations/incidents"),
        authedFetch("/admin/operations/sos"),
      ])

      if (!metricsResponse.ok) throw new Error(await getErrorMessage(metricsResponse))
      if (!incidentsResponse.ok) throw new Error(await getErrorMessage(incidentsResponse))
      if (!sosResponse.ok) throw new Error(await getErrorMessage(sosResponse))

      const [metricsData, incidentsData, sosData] = await Promise.all([
        metricsResponse.json() as Promise<OperationsMetrics>,
        incidentsResponse.json() as Promise<Incident[]>,
        sosResponse.json() as Promise<SosAlert[]>,
      ])

      setMetrics({ ...EMPTY_METRICS, ...metricsData })
      setIncidents(Array.isArray(incidentsData) ? incidentsData : [])
      setSosAlerts(Array.isArray(sosData) ? sosData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operations center")
      setMetrics(EMPTY_METRICS)
      setIncidents([])
      setSosAlerts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const criticalSosAlerts = useMemo(
    () => sosAlerts.filter((alert) => alert.status === "ACTIVE"),
    [sosAlerts],
  )

  const metricCards: MetricCard[] = [
    { label: "Active Drivers", value: formatNumber(metrics.activeDrivers), color: "text-primary", icon: Car },
    { label: "Active Trips", value: formatNumber(metrics.activeTrips), color: "text-blue-500", icon: Map },
    { label: "Pending Requests", value: formatNumber(metrics.pendingTrips), color: "text-orange-500", icon: Activity },
    { label: "SOS Alerts", value: formatNumber(metrics.sosAlerts), color: "text-red-500", icon: BellRing },
    { label: "Open Incidents", value: formatNumber(metrics.openIncidents), color: "text-purple-500", icon: ShieldAlert },
    { label: "Completion Rate", value: `${metrics.tripCompletionRate}%`, color: "text-green-500", icon: Network },
  ]

  const modules: OperationsModuleCard[] = [
    { label: "Live Map Center", icon: Crosshair, href: "/admin/operations/map", desc: `${formatNumber(metrics.activeDrivers)} drivers tracked` },
    { label: "Manual Dispatch", icon: Users, desc: `${formatNumber(metrics.pendingTrips)} pending trip requests` },
    { label: "SOS Emergency", icon: PhoneCall, desc: `${formatNumber(criticalSosAlerts.length)} active emergency alerts` },
    { label: "Comms Broadcast", icon: Megaphone, desc: `${formatMoney(metrics.revenueToday)} revenue today` },
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
                  <Network className="h-8 w-8 text-primary" />
                  Operations Command Center
                </HeadingLg>
                <p className="text-muted-foreground">Mission control for dispatch, emergencies, incidents, and fleet health.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  LIVE SYSTEM HEALTH: NORMAL
                </div>
                <Button variant="outline" onClick={() => void loadData(true)} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {metricCards.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card key={metric.label} className="glass-premium">
                    <CardContent className="flex min-h-32 flex-col items-center justify-center p-4 text-center">
                      <Icon className={`mb-2 h-6 w-6 ${metric.color}`} />
                      <div className="text-2xl font-black">{loading ? "..." : metric.value}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{metric.label}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => {
                const Icon = module.icon
                const content = (
                  <Card className="glass-premium h-full transition-colors hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold">{module.label}</div>
                          <div className="text-sm font-normal text-muted-foreground">{module.desc}</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                )

                return module.href ? (
                  <Link href={module.href} key={module.label}>
                    {content}
                  </Link>
                ) : (
                  <div key={module.label}>{content}</div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="glass-premium">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-purple-500" />
                      Incident Queue
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Open and recent incidents from the operations backend.</p>
                  </div>
                  <Badge variant="outline">{incidents.length} incidents</Badge>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading incidents...
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No incidents are currently recorded.
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {incidents.slice(0, 8).map((incident) => (
                        <div key={incident.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{incident.title}</p>
                              <Badge variant={statusVariant(incident.status)}>{incident.status}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {incident.type} · {incidentActor(incident)} · {formatDate(incident.createdAt)}
                            </p>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">{incident.id.slice(0, 12)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-premium">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PhoneCall className="h-5 w-5 text-red-500" />
                      SOS Alerts
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Emergency requests currently visible to operations.</p>
                  </div>
                  <Badge variant={criticalSosAlerts.length ? "destructive" : "outline"}>
                    {criticalSosAlerts.length} active
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading SOS alerts...
                    </div>
                  ) : sosAlerts.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No SOS alerts have been raised.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sosAlerts.slice(0, 6).map((alert) => (
                        <div key={alert.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{alert.user?.name || alert.user?.phone || "Unknown user"}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{alert.message || "Emergency alert raised"}</p>
                            </div>
                            <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {formatDate(alert.createdAt)}
                            {alert.lat != null && alert.lng != null ? ` · ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : ""}
                          </p>
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
