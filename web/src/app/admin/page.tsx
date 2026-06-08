"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd, HeadingSm } from "@/components/ui/typography"
import { GlassSurface } from "@/components/ui/glass-surface"
import { authedFetch } from "@/lib/auth"
import { useTranslation } from "react-i18next"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Banknote,
  Building2,
  Car,
  Crown,
  FileText,
  HandCoins,
  Headphones,
  KeySquare,
  Layers,
  LifeBuoy,
  Map,
  MapPin,
  Network,
  Package,
  PlaneTakeoff,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  Tag,
  TrendingUp,
  Undo2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

type Overview = {
  users: number
  drivers: number
  rides: number
  orders: number
  deliveries: number
  openTickets: number
  activeRides: number
  activeOrders: number
  activeDeliveries: number
  pendingKyc?: number
}

type SupportTicket = {
  id: string
  subject?: string
  category?: string
  priority?: string
  status?: string
  createdAt?: string
  requester?: { name?: string | null; phone?: string | null } | null
}

type SosAlert = {
  id: string
  tripId?: string | null
  lat?: number | null
  lng?: number | null
  createdAt: string
  user?: { name?: string | null; phone?: string | null } | null
}

type MetricCard = {
  label: string
  value: number | string
  icon: LucideIcon
  href: string
}

const EMPTY_OVERVIEW: Overview = {
  users: 0,
  drivers: 0,
  rides: 0,
  orders: 0,
  deliveries: 0,
  openTickets: 0,
  activeRides: 0,
  activeOrders: 0,
  activeDeliveries: 0,
  pendingKyc: 0,
}

const TICKETS_PER_PAGE = 25

async function fetchJson<T>(path: string, fallback: T): Promise<{ data: T; error?: string }> {
  try {
    const response = await authedFetch(path)
    if (!response.ok) return { data: fallback, error: `${path} returned ${response.status}` }
    return { data: (await response.json()) as T }
  } catch (err) {
    return { data: fallback, error: err instanceof Error ? err.message : `Failed to load ${path}` }
  }
}

function formatValue(value: number | string | null | undefined) {
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "string") return value
  return "0"
}

function supportRequester(ticket: SupportTicket) {
  return ticket.requester?.name ?? ticket.requester?.phone ?? "Unknown user"
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW)
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([])
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [ticketsPage, setTicketsPage] = useState(1)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    const [overviewResult, ticketsResult, sosResult] = await Promise.all([
      fetchJson<Overview>("/admin/overview", EMPTY_OVERVIEW),
      fetchJson<SupportTicket[]>(
        `/support/tickets?status=OPEN&page=${page}&limit=${TICKETS_PER_PAGE}`,
        [],
      ),
      fetchJson<SosAlert[]>("/admin/sos/active", []),
    ])

    setOverview({ ...EMPTY_OVERVIEW, ...overviewResult.data })
    setOpenTickets(Array.isArray(ticketsResult.data) ? ticketsResult.data : [])
    setSosAlerts(Array.isArray(sosResult.data) ? sosResult.data : [])
    setErrors([overviewResult.error, ticketsResult.error, sosResult.error].filter(Boolean) as string[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load(ticketsPage)
  }, [load, ticketsPage])

  async function resolveSos(id: string) {
    if (!confirm(t("admin.mark_resolved", "Mark Resolved") + "?")) return
    try {
      const response = await authedFetch(`/admin/sos/${id}/resolve`, { method: "PATCH" })
      if (!response.ok) throw new Error("Failed to resolve SOS")
      void load(ticketsPage)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve SOS")
    }
  }

  const metrics: MetricCard[] = [
    { label: "Users", value: overview.users, icon: Users, href: "/admin/users" },
    { label: "Drivers", value: overview.drivers, icon: Car, href: "/admin/drivers" },
    { label: "Orders", value: overview.orders, icon: Store, href: "/admin/orders" },
    { label: "Deliveries", value: overview.deliveries, icon: Package, href: "/admin/deliveries" },
    { label: "Open Tickets", value: overview.openTickets, icon: LifeBuoy, href: "/admin/support" },
    { label: "Active Rides", value: overview.activeRides, icon: Activity, href: "/admin/trips" },
    { label: "Active Orders", value: overview.activeOrders, icon: Store, href: "/admin/orders" },
    { label: "Active Deliveries", value: overview.activeDeliveries, icon: Package, href: "/admin/deliveries" },
  ]

  const moduleGroups = [
    {
      title: "Operations & Fleet",
      modules: [
        { label: "Live Map", value: "Real-time", icon: Map, href: "/admin/live-map" },
        { label: "OCC Console", value: "Mission Control", icon: Network, href: "/admin/operations" },
        { label: "Airport", value: "Ops & Queues", icon: PlaneTakeoff, href: "/admin/airport" },
        { label: "Surge Zones", value: "Control", icon: Activity, href: "/admin/surge" },
        { label: "Vehicles", value: "Registry", icon: Car, href: "/admin/vehicles" },
        { label: "Driver Tiers", value: "Manage", icon: TrendingUp, href: "/admin/driver-tiers" },
      ]
    },
    {
      title: "Finance & Growth",
      modules: [
        { label: "Finance", value: "Cash Center", icon: Banknote, href: "/admin/finance" },
        { label: "Cash Collections", value: "Receivables", icon: HandCoins, href: "/admin/cash-collections" },
        { label: "Refunds", value: "Requests", icon: Undo2, href: "/admin/refunds" },
        { label: "Marketing", value: "Campaigns", icon: Tag, href: "/admin/marketing" },
        { label: "Loyalty System", value: "Configure", icon: Award, href: "/admin/loyalty" },
        { label: "Subscriptions", value: "Plans & VIPs", icon: Crown, href: "/admin/subscriptions" },
        { label: "Corporate", value: "B2B Accounts", icon: Building2, href: "/admin/corporate" },
      ]
    },
    {
      title: "Trust & Safety",
      modules: [
        { label: "KYC Review", value: (overview.pendingKyc ?? 0) > 0 ? `${overview.pendingKyc} pending` : "Manage", icon: UserCheck, href: "/admin/kyc" },
        { label: "Customer Support", value: "Help Desk", icon: LifeBuoy, href: "/admin/support" },
        { label: "Ratings & Reviews", value: "Moderation", icon: Star, href: "/admin/reviews" },
        { label: "Fraud Center", value: "Dashboard", icon: AlertTriangle, href: "/admin/fraud" },
        { label: "Fraud Alerts", value: "Live Feed", icon: ShieldAlert, href: "/admin/fraud/alerts" },
      ]
    },
    {
      title: "System & Config",
      modules: [
        { label: "Custom Places", value: "Search", icon: MapPin, href: "/admin/places" },
        { label: "CMS Engine", value: "Content", icon: FileText, href: "/admin/cms" },
        { label: "Roles", value: "RBAC", icon: Shield, href: "/admin/roles" },
        { label: "Permissions", value: "Matrix", icon: KeySquare, href: "/admin/permissions" },
        { label: "Admin Users", value: "Directory", icon: ShieldAlert, href: "/admin/admin-users" },
      ]
    }
  ]

  const supportCount = (keyword: string) =>
    openTickets.filter((ticket) => ticket.category?.toLowerCase().includes(keyword)).length

  const highPriorityCount = openTickets.filter((ticket) =>
    ["HIGH", "URGENT"].includes((ticket.priority ?? "").toUpperCase()),
  ).length

  const queues = [
    { label: "Ride safety checks", value: supportCount("ride"), tone: highPriorityCount > 0 ? "High" : "Normal" },
    { label: "Delivery disputes", value: supportCount("delivery"), tone: "Normal" },
    { label: "Driver verifications", value: supportCount("driver"), tone: "Normal" },
    { label: "All open tickets", value: openTickets.length, tone: highPriorityCount > 0 ? "High" : "Normal" },
  ]

  const marketplace: MetricCard[] = [
    { label: "Active rides", value: overview.activeRides, icon: Car, href: "/admin/trips" },
    { label: "Active food orders", value: overview.activeOrders, icon: Store, href: "/admin/orders" },
    { label: "Active deliveries", value: overview.activeDeliveries, icon: Package, href: "/admin/deliveries" },
  ]

  const SkeletonValue = () => <div className="h-7 w-16 animate-pulse rounded-md bg-muted/50 mt-1" />
  const SkeletonText = () => <div className="h-4 w-12 animate-pulse rounded bg-muted/50 mt-1.5" />

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <HeadingMd className="text-3xl font-black">{t("admin.title", "Noori Operations")}</HeadingMd>
                <BodyMd className="mt-2 text-muted-foreground text-lg">
                  {t("admin.description", "Admin control center for mobility, food, delivery, wallet, safety, and support.")}
                </BodyMd>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="glass h-11 px-6 rounded-full" onClick={() => void load(ticketsPage)} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 me-2 ${loading ? "animate-spin" : ""}`} />
                  {t("admin.refresh", "Refresh")}
                </Button>
                <Button className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(0,105,71,0.25)] hover:shadow-[0_0_25px_rgba(0,105,71,0.4)] transition-all" asChild>
                  <a href="#open-tickets">
                    <ShieldCheck className="h-4 w-4 me-2" />
                    {overview.openTickets > 0 ? overview.openTickets : "No"} {t("admin.open_support_tickets", "Open Support Tickets").toLowerCase()}
                  </a>
                </Button>
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive font-medium">
                {errors.map((message) => (
                  <p key={message} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {message}</p>
                ))}
              </div>
            ) : null}

            {/* Top Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Link key={metric.label} href={metric.href} className="block group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <GlassSurface variant="default" intensity="low" className="h-full transition-all group-hover:bg-primary/5 group-hover:border-primary/20 rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex min-h-[120px] items-center justify-between p-6 relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-125 rtl:right-auto rtl:left-0 rtl:rounded-bl-none rtl:rounded-br-[100px]" />
                        <div className="z-10">
                          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{metric.label}</p>
                          {loading ? <SkeletonValue /> : <p className="mt-2 text-4xl font-black text-foreground group-hover:text-primary transition-colors">{formatValue(metric.value)}</p>}
                        </div>
                        <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center border border-muted z-10 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors shadow-sm">
                            <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </GlassSurface>
                  </Link>
                )
              })}
            </div>

            <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-4">
              {/* Main Modules Area */}
              <div className="lg:col-span-2 xl:col-span-3 space-y-10">
                {moduleGroups.map((group) => (
                   <div key={group.title} className="space-y-4">
                     <HeadingSm className="text-xl font-bold flex items-center gap-3">
                       <div className="w-2.5 h-6 rounded-full bg-primary" />
                       {group.title}
                     </HeadingSm>
                     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                       {group.modules.map((module) => {
                          const Icon = module.icon
                          return (
                            <Link
                              key={module.label}
                              href={module.href}
                              className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <div>
                                <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{module.label}</p>
                                {loading ? <SkeletonText /> : <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatValue(module.value)}</p>}
                              </div>
                              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </Link>
                          )
                       })}
                     </div>
                   </div>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                  {/* Live Marketplace Widget */}
                  <Card className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden relative rounded-3xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full -z-10 rtl:right-auto rtl:left-0 rtl:rounded-bl-none rtl:rounded-br-full" />
                    <CardHeader className="pb-2 pt-6 px-6">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-6 w-6 text-primary" />
                        {t("admin.live_marketplace", "Live Marketplace")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-6 pt-4">
                      {marketplace.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="group flex items-center justify-between rounded-xl border bg-background p-4 transition-all hover:border-primary/40 hover:bg-primary/5 shadow-sm hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <div>
                               <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-primary transition-colors">
                                  <Icon className="h-4 w-4" />
                                  <span className="font-semibold text-xs uppercase tracking-wider">{item.label}</span>
                               </div>
                               {loading ? <SkeletonValue /> : <p className="text-3xl font-black">{item.value.toLocaleString()}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                   <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                                </div>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground">{t("admin.in_progress", "in progress")}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </CardContent>
                  </Card>

                  {/* Priority Queues Widget */}
                  <Card className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl">
                    <CardHeader className="pb-2 pt-6 px-6">
                      <CardTitle className="flex items-center gap-2 text-xl">
                         <Layers className="h-6 w-6 text-primary" />
                         {t("admin.priority_queues", "Priority Queues")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6 pt-4">
                      {queues.map((queue) => (
                        <div key={queue.label} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
                          <div>
                            <p className="font-bold text-sm">{queue.label}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-1">{queue.value} items</p>
                          </div>
                          <Badge variant={queue.tone === "High" ? "destructive" : "secondary"} className={`px-3 py-1 text-xs ${queue.tone === "High" ? "animate-pulse" : ""}`}>{queue.tone}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* SOS Alerts Sidebar Widget */}
                  {sosAlerts.length > 0 ? (
                    <Card className="border-destructive shadow-[0_8px_30px_rgba(255,0,0,0.1)] rounded-3xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
                      <CardHeader className="bg-destructive/10 text-destructive border-b border-destructive/10">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <ShieldAlert className="h-6 w-6 animate-pulse" />
                          {t("admin.sos_title", "Active SOS Alerts")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 relative z-10">
                        <ul className="divide-y divide-destructive/10">
                          {sosAlerts.map((alert) => (
                            <li key={alert.id} className="flex flex-col gap-4 p-5">
                              <div>
                                <p className="font-bold text-destructive text-base">
                                  {t("admin.sos_triggered", "SOS triggered by")} {alert.user?.name || alert.user?.phone || "Unknown"}
                                </p>
                                <p className="mt-1.5 text-sm font-medium text-destructive/80">
                                  {alert.tripId ? `Trip ID: ${alert.tripId.slice(-8)}` : "No active trip"}
                                  {alert.lat && alert.lng ? ` • Loc: ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : ""}
                                </p>
                                <p className="mt-2 font-mono text-xs opacity-70">{new Date(alert.createdAt).toLocaleString()}</p>
                              </div>
                              <Button
                                variant="outline"
                                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white font-bold"
                                onClick={() => void resolveSos(alert.id)}
                              >
                                {t("admin.mark_resolved", "Mark Resolved")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : null}
              </div>
            </div>

            {/* Support Tickets Area */}
            <Card id="open-tickets" className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
              <div className="bg-muted/30 px-6 py-6 border-b">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Headphones className="h-6 w-6 text-primary" />
                      {t("admin.open_support_tickets", "Open Support Tickets")}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground mt-2">Latest open support requests visible to admin and support roles.</p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full font-bold">
                    <Link href="/admin/support">Open Support Center</Link>
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground font-medium animate-pulse">{t("admin.loading_tickets", "Loading tickets…")}</div>
                ) : openTickets.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                       <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-bold">{t("admin.no_tickets", "No open tickets. All clear.")}</p>
                  </div>
                ) : (
                  <>
                    <ul className="divide-y">
                      {openTickets.map((ticket) => (
                        <li key={ticket.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-base">{ticket.subject ?? ticket.category ?? "Support request"}</p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              <span className="text-foreground">{supportRequester(ticket)}</span>
                              {ticket.category ? ` • ${ticket.category}` : ""}
                              {ticket.createdAt ? ` • ${new Date(ticket.createdAt).toLocaleString()}` : ""}
                            </p>
                          </div>
                          <Badge
                            variant={["HIGH", "URGENT"].includes((ticket.priority ?? "").toUpperCase()) ? "destructive" : "secondary"}
                            className="px-3 py-1"
                          >
                            {ticket.priority ?? "NORMAL"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-muted/10 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t">
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("admin.page", "Page")} {ticketsPage} — showing {openTickets.length} of {overview.openTickets}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          className="rounded-full"
                          variant="outline"
                          disabled={ticketsPage === 1 || loading}
                          onClick={() => setTicketsPage((page) => Math.max(page - 1, 1))}
                        >
                          {t("admin.previous", "Previous")}
                        </Button>
                        <Button
                          className="rounded-full"
                          variant="outline"
                          disabled={openTickets.length < TICKETS_PER_PAGE || loading}
                          onClick={() => setTicketsPage((page) => page + 1)}
                        >
                          {t("admin.next", "Next")}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
