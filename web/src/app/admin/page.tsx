"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart,
  Users,
  Car,
  Package,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Store,
  Headphones
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"

type Overview = {
  activeRides: number
  activeOrders: number
  activeDeliveries: number
  openTickets: number
  totalRevenue: number
  totalUsers: number
  totalDrivers: number
  growth: number
}

type SupportTicket = {
  id: string
  subject?: string | null
  category?: string | null
  priority?: string | null
  status: string
  createdAt: string
  requester?: { name?: string | null; phone?: string | null } | null
}

type SosAlert = {
  id: string
  tripId?: string | null
  userId?: string | null
  lat?: number | null
  lng?: number | null
  status: string
  createdAt: string
  user?: { name?: string | null; phone?: string | null } | null
}

const TICKETS_PER_PAGE = 5

export default function AdminOverviewPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview>({
    activeRides: 0,
    activeOrders: 0,
    activeDeliveries: 0,
    openTickets: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalDrivers: 0,
    growth: 0,
  })
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([])
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([])
  const [ticketsPage, setTicketsPage] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    setErrors([])
    try {
      const [ovRes, tkRes, sosRes] = await Promise.all([
        authedFetch("/admin/overview"),
        authedFetch(`/admin/support/tickets?status=OPEN&page=${page}&limit=${TICKETS_PER_PAGE}`),
        authedFetch("/admin/safety/sos?status=PENDING")
      ])

      if (ovRes.ok) setOverview(await ovRes.json())
      if (tkRes.ok) {
        const data = await tkRes.json()
        setOpenTickets(Array.isArray(data) ? data : data.items || [])
      }
      if (sosRes.ok) setSosAlerts(await sosRes.json())

    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Failed to load dashboard data"])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(ticketsPage)
  }, [load, ticketsPage])

  const resolveSos = async (id: string) => {
    try {
      const res = await authedFetch(`/admin/safety/sos/${id}/resolve`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to resolve SOS alert")
      setSosAlerts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const metrics = [
    { label: t('admin.total_revenue'), value: overview.totalRevenue, icon: TrendingUp, href: "/admin/finance" },
    { label: t('admin.total_users'), value: overview.totalUsers, icon: Users, href: "/admin/users" },
    { label: t('admin.total_drivers'), value: overview.totalDrivers, icon: Car, href: "/admin/drivers" },
    { label: t('admin.open_tickets_label', 'Open Support Tickets'), value: overview.openTickets, icon: Headphones, href: "/admin/support" },
  ]

  const highPriorityCount = openTickets.filter(t =>
    ["HIGH", "URGENT"].includes((t.priority ?? "").toUpperCase())
  ).length

  const supportCount = (cat: string) => openTickets.filter(t =>
    (t.category ?? "").toLowerCase().includes(cat.toLowerCase()),
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
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title={t('admin.title')}
            subtitle={t('admin.description')}
            showBackLink={false}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void load(ticketsPage)} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {t('admin.refresh')}
                </Button>
                <Button variant="outline" asChild>
                  <a href="#open-tickets">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t('admin.open_tickets', { count: overview.openTickets })}
                  </a>
                </Button>
              </div>
            }
          />

          {errors.length > 0 ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive backdrop-blur-sm">
              {errors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Link key={metric.label} href={metric.href} className="block">
                <Card className="transition-colors hover:bg-muted/30 border-primary/10">
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
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>{t('admin.live_marketplace')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {marketplace.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30 border-primary/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-4 text-3xl font-bold">
                      {loading ? "—" : item.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('admin.in_progress')} <ArrowRight className="h-3 w-3" />
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>{t('admin.priority_queues')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {queues.map((queue) => (
                  <div
                    key={queue.label}
                    className="flex items-center justify-between rounded-lg border p-3 border-primary/10"
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
            <Card className="border-destructive shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/10 text-destructive">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {t('admin.sos_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-destructive/20">
                  {sosAlerts.map(alert => (
                    <li key={alert.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-destructive">{t('admin.sos_triggered', { name: alert.user?.name || alert.user?.phone || 'Unknown' })}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.tripId ? `Trip ID: ${alert.tripId.slice(-8)}` : 'No active trip'} 
                          {alert.lat && alert.lng ? ` · Location: ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : ''}
                        </p>
                        <p className="text-xs mt-2 font-mono">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => resolveSos(alert.id)}>
                        {t('admin.mark_resolved')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card id="open-tickets" className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                {t('admin.open_support_tickets')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">{t('admin.loading_tickets')}</p>
              ) : openTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('admin.no_tickets')}</p>
              ) : (
                <>
                  <ul className="divide-y divide-primary/5">
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
                      {t('admin.page', { page: ticketsPage, showing: openTickets.length, total: overview.openTickets })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ticketsPage === 1 || loading}
                        onClick={() => setTicketsPage((p) => Math.max(p - 1, 1))}
                      >
                        {t('admin.previous')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={openTickets.length < TICKETS_PER_PAGE || loading}
                        onClick={() => setTicketsPage((p) => p + 1)}
                      >
                        {t('admin.next')}
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
