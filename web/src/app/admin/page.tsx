"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
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
    if (!confirm("Mark this SOS as resolved?")) return
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

  const modules: MetricCard[] = [
    { label: "Surge Zones", value: "Control", icon: Activity, href: "/admin/surge" },
    { label: "Live Map", value: "Real-time", icon: Map, href: "/admin/live-map" },
    { label: "Custom Places", value: "Search", icon: MapPin, href: "/admin/places" },
    { label: "KYC Review", value: (overview.pendingKyc ?? 0) > 0 ? `${overview.pendingKyc} pending` : "Manage", icon: UserCheck, href: "/admin/kyc" },
    { label: "Loyalty System", value: "Configure", icon: Award, href: "/admin/loyalty" },
    { label: "Driver Tiers", value: "Manage", icon: TrendingUp, href: "/admin/driver-tiers" },
    { label: "Ratings & Reviews", value: "Moderation", icon: Star, href: "/admin/reviews" },
    { label: "Vehicles", value: "Registry", icon: Car, href: "/admin/vehicles" },
    { label: "Finance", value: "Cash Center", icon: Banknote, href: "/admin/finance" },
    { label: "Cash Collections", value: "Receivables", icon: HandCoins, href: "/admin/cash-collections" },
    { label: "Refunds", value: "Requests", icon: Undo2, href: "/admin/refunds" },
    { label: "Subscriptions", value: "Plans & VIPs", icon: Crown, href: "/admin/subscriptions" },
    { label: "Corporate", value: "B2B Accounts", icon: Building2, href: "/admin/corporate" },
    { label: "Airport", value: "Ops & Queues", icon: PlaneTakeoff, href: "/admin/airport" },
    { label: "Marketing", value: "Campaigns", icon: Tag, href: "/admin/marketing" },
    { label: "CMS Engine", value: "Content", icon: FileText, href: "/admin/cms" },
    { label: "OCC Console", value: "Mission Control", icon: Network, href: "/admin/operations" },
    { label: "Fraud Center", value: "Dashboard", icon: AlertTriangle, href: "/admin/fraud" },
    { label: "Fraud Alerts", value: "Live Feed", icon: ShieldAlert, href: "/admin/fraud/alerts" },
    { label: "Customer Support", value: "Help Desk", icon: LifeBuoy, href: "/admin/support" },
    { label: "Roles", value: "RBAC", icon: Shield, href: "/admin/roles" },
    { label: "Permissions", value: "Matrix", icon: KeySquare, href: "/admin/permissions" },
    { label: "Admin Users", value: "Directory", icon: ShieldAlert, href: "/admin/admin-users" },
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

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <HeadingMd className="text-2xl">Noori Operations</HeadingMd>
                <BodyMd className="text-muted-foreground">
                  Admin control center for mobility, food, delivery, wallet, safety, support, and risk operations.
                </BodyMd>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => void load(ticketsPage)} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" asChild>
                  <a href="#open-tickets">
                    <ShieldCheck className="h-4 w-4" />
                    {formatValue(overview.openTickets)} open tickets
                  </a>
                </Button>
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {errors.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Link key={metric.label} href={metric.href} className="block">
                    <Card className="h-full transition-colors hover:bg-muted/30">
                      <CardContent className="flex min-h-28 items-center justify-between p-5">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="mt-1 text-2xl font-bold">{loading ? "..." : formatValue(metric.value)}</p>
                        </div>
                        <Icon className="h-6 w-6 text-primary" />
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {modules.map((module) => {
                    const Icon = module.icon
                    return (
                      <Link
                        key={module.label}
                        href={module.href}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{module.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{loading ? "..." : formatValue(module.value)}</p>
                          </div>
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Live Marketplace</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {marketplace.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.label}</span>
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="mt-4 text-3xl font-bold">{loading ? "..." : item.value.toLocaleString()}</p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          In progress now <ArrowRight className="h-3 w-3" />
                        </p>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Queues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {queues.map((queue) => (
                    <div key={queue.label} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{queue.label}</p>
                        <p className="text-sm text-muted-foreground">{queue.value} items</p>
                      </div>
                      <Badge variant={queue.tone === "High" ? "destructive" : "secondary"}>{queue.tone}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {sosAlerts.length > 0 ? (
              <Card className="border-destructive shadow-sm">
                <CardHeader className="bg-destructive/10 text-destructive">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Active SOS Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {sosAlerts.map((alert) => (
                      <li key={alert.id} className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                        <div>
                          <p className="font-bold text-destructive">
                            SOS triggered by {alert.user?.name || alert.user?.phone || "Unknown"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {alert.tripId ? `Trip ID: ${alert.tripId.slice(-8)}` : "No active trip"}
                            {alert.lat && alert.lng ? ` - Location: ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : ""}
                          </p>
                          <p className="mt-2 font-mono text-xs">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => void resolveSos(alert.id)}
                        >
                          Mark Resolved
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card id="open-tickets">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Open Support Tickets
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Latest open support requests visible to admin and support roles.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/support">Open Support Center</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading tickets...</p>
                ) : openTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open tickets. All clear.</p>
                ) : (
                  <>
                    <ul className="divide-y">
                      {openTickets.map((ticket) => (
                        <li key={ticket.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{ticket.subject ?? ticket.category ?? "Support request"}</p>
                            <p className="text-xs text-muted-foreground">
                              {supportRequester(ticket)}
                              {ticket.category ? ` - ${ticket.category}` : ""}
                              {ticket.createdAt ? ` - ${new Date(ticket.createdAt).toLocaleString()}` : ""}
                            </p>
                          </div>
                          <Badge
                            variant={["HIGH", "URGENT"].includes((ticket.priority ?? "").toUpperCase()) ? "destructive" : "secondary"}
                          >
                            {ticket.priority ?? "NORMAL"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Page {ticketsPage} - showing {openTickets.length} of {overview.openTickets}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ticketsPage === 1 || loading}
                          onClick={() => setTicketsPage((page) => Math.max(page - 1, 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={openTickets.length < TICKETS_PER_PAGE || loading}
                          onClick={() => setTicketsPage((page) => page + 1)}
                        >
                          Next
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
