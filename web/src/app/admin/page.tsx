"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { Car, Headphones, Package, RefreshCw, ShieldCheck, Store, Users, ArrowRight, Activity } from "lucide-react"
import { AuthGate } from "@/components/auth-gate"
import Link from "next/link"
import { authedFetch } from "@/lib/auth"

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
}

const TICKETS_PER_PAGE = 25

async function fetchJson<T>(path: string, fallback: T): Promise<{ data: T; error?: string }> {
  try {
    const response = await authedFetch(path)
    if (!response.ok) {
      return { data: fallback, error: `${path} → ${response.status}` }
    }
    return { data: (await response.json()) as T }
  } catch (err) {
    return { data: fallback, error: err instanceof Error ? err.message : `Failed to load ${path}` }
  }
}

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW)
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([])
  const [sosAlerts, setSosAlerts] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [ticketsPage, setTicketsPage] = useState(1)

  const load = useCallback(
    async (page = 1) => {
      setLoading(true)
      const [overviewResult, ticketsResult, sosResult] = await Promise.all([
        fetchJson<Overview>("/admin/overview", EMPTY_OVERVIEW),
        fetchJson<SupportTicket[]>(
          `/support/tickets?status=OPEN&page=${page}&limit=${TICKETS_PER_PAGE}`,
          [],
        ),
        fetchJson<any[]>("/admin/sos/active", []),
      ])

      setOverview(overviewResult.data)
      setOpenTickets(Array.isArray(ticketsResult.data) ? ticketsResult.data : [])
      setSosAlerts(Array.isArray(sosResult.data) ? sosResult.data : [])
      setErrors([overviewResult.error, ticketsResult.error, sosResult.error].filter(Boolean) as string[])
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    void load(ticketsPage)
  }, [load, ticketsPage])

  async function resolveSos(id: string) {
    if (!confirm('Mark this SOS as resolved?')) return
    try {
      const res = await authedFetch(`/admin/sos/${id}/resolve`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to resolve SOS')
      void load(ticketsPage)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const metrics = [
    { label: "Users", value: overview.users, icon: Users, href: "/admin/users" },
    { label: "Drivers", value: overview.drivers, icon: Car, href: "/admin/drivers" },
    { label: "Orders", value: overview.orders, icon: Store, href: "/admin/orders" },
    { label: "Deliveries", value: overview.deliveries, icon: Package, href: "/admin/deliveries" },
    { label: "Surge Zones", value: "Control", icon: Activity, href: "/admin/surge" },
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

  const marketplace = [
    { label: "Active rides", value: overview.activeRides, icon: Car, href: "/admin/trips" },
    { label: "Active food orders", value: overview.activeOrders, icon: Store, href: "/admin/orders" },
    { label: "Active deliveries", value: overview.activeDeliveries, icon: Package, href: "/admin/deliveries" },
  ]

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <HeadingMd className="text-2xl">Noori Operations</HeadingMd>
              <BodyMd className="text-muted-foreground">
                Admin control center for mobility, food, delivery, wallet, safety, and support.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void load(ticketsPage)} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" asChild>
                <a href="#open-tickets">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Open tickets ({overview.openTickets})
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
            {metrics.map((metric) => (
              <Link key={metric.label} href={metric.href} className="block">
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 text-2xl font-bold">
                        {loading ? "—" : metric.value.toLocaleString()}
                      </p>
                    </div>
                    <metric.icon className="h-6 w-6 text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Live Marketplace</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {marketplace.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-4 text-3xl font-bold">
                      {loading ? "—" : item.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      in progress now <ArrowRight className="h-3 w-3" />
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Queues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {queues.map((queue) => (
                  <div
                    key={queue.label}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{queue.label}</p>
                      <p className="text-sm text-muted-foreground">{queue.value} items</p>
                    </div>
                    <Badge variant={queue.tone === "High" ? "destructive" : "secondary"}>
                      {queue.tone}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {sosAlerts.length > 0 && (
            <Card className="border-destructive shadow-sm">
              <CardHeader className="bg-destructive/10 text-destructive">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Active SOS Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {sosAlerts.map(alert => (
                    <li key={alert.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-destructive">SOS triggered by {alert.user?.name || alert.user?.phone || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.tripId ? `Trip ID: ${alert.tripId.slice(-8)}` : 'No active trip'} 
                          {alert.lat && alert.lng ? ` · Location: ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : ''}
                        </p>
                        <p className="text-xs mt-2 font-mono">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => resolveSos(alert.id)}>
                        Mark Resolved
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card id="open-tickets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Open Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading tickets…</p>
              ) : openTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tickets. All clear.</p>
              ) : (
                <>
                  <ul className="divide-y">
                    {openTickets.map((ticket) => (
                      <li key={ticket.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {ticket.subject ?? ticket.category ?? "Support request"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.requester?.name ?? ticket.requester?.phone ?? "Unknown user"}
                            {ticket.category ? ` · ${ticket.category}` : ""}
                            {ticket.createdAt
                              ? ` · ${new Date(ticket.createdAt).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant={
                            ["HIGH", "URGENT"].includes((ticket.priority ?? "").toUpperCase())
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {ticket.priority ?? "NORMAL"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Page {ticketsPage} · showing {openTickets.length} of {overview.openTickets} open
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ticketsPage === 1 || loading}
                        onClick={() => setTicketsPage((p) => Math.max(p - 1, 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={openTickets.length < TICKETS_PER_PAGE || loading}
                        onClick={() => setTicketsPage((p) => p + 1)}
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
    </AuthGate>
  )
}
