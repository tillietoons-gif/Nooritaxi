"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassSurface } from "@/components/ui/glass-surface"
import { Input } from "@/components/ui/input"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { authedFetch } from "@/lib/auth"
import { Check, LoaderCircle, RefreshCcw, Undo2, X } from "lucide-react"

type RefundStatus = "PENDING" | "APPROVED" | "REJECTED"
type RefundService = "TRIP" | "ORDER" | "DELIVERY" | "UNKNOWN"

type RefundRequest = {
  id: string
  tripId?: string | null
  orderId?: string | null
  deliveryId?: string | null
  amount: number | string
  reason: string
  status: RefundStatus
  createdAt: string
  processedAt?: string | null
  user: {
    name?: string | null
    phone?: string | null
  }
}

const ALL_STATUSES = "ALL"
const ALL_SERVICES = "ALL"

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

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

function formatMoney(value: number | string | null | undefined) {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(toNumber(value))} AFN`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown date"
  return new Date(value).toLocaleString()
}

function statusVariant(status: RefundStatus) {
  if (status === "APPROVED") return "default" as const
  if (status === "PENDING") return "secondary" as const
  return "destructive" as const
}

function getRefundService(refund: RefundRequest): RefundService {
  if (refund.tripId) return "TRIP"
  if (refund.orderId) return "ORDER"
  if (refund.deliveryId) return "DELIVERY"
  return "UNKNOWN"
}

function getServiceLabel(service: RefundService) {
  if (service === "TRIP") return "Trip"
  if (service === "ORDER") return "Food Order"
  if (service === "DELIVERY") return "Delivery"
  return "Unknown"
}

function getRefundReference(refund: RefundRequest) {
  return refund.tripId ?? refund.orderId ?? refund.deliveryId ?? refund.id
}

function getRefundStatusLabel(status: typeof ALL_STATUSES | RefundStatus) {
  if (status === ALL_STATUSES) return "live refund requests"
  if (status === "PENDING") return "pending refund requests"
  if (status === "APPROVED") return "approved refund requests"
  return "rejected refund requests"
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<typeof ALL_STATUSES | RefundStatus>(ALL_STATUSES)
  const [serviceFilter, setServiceFilter] = useState<typeof ALL_SERVICES | RefundService>(ALL_SERVICES)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== ALL_STATUSES) params.set("status", statusFilter)

      const path = params.size > 0
        ? `/admin/finance/refunds?${params.toString()}`
        : "/admin/finance/refunds"

      const response = await authedFetch(path)
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const payload = (await response.json()) as RefundRequest[]
      setRefunds(Array.isArray(payload) ? payload : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load refund requests")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredRefunds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return refunds.filter((refund) => {
      const service = getRefundService(refund)
      const matchesService = serviceFilter === ALL_SERVICES || service === serviceFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        refund.id.toLowerCase().includes(normalizedQuery) ||
        refund.reason.toLowerCase().includes(normalizedQuery) ||
        (refund.user.name ?? "").toLowerCase().includes(normalizedQuery) ||
        (refund.user.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        getRefundReference(refund).toLowerCase().includes(normalizedQuery)

      return matchesService && matchesQuery
    })
  }, [query, refunds, serviceFilter])

  const pendingCount = useMemo(
    () => refunds.filter((refund) => refund.status === "PENDING").length,
    [refunds],
  )

  const approvedCount = useMemo(
    () => refunds.filter((refund) => refund.status === "APPROVED").length,
    [refunds],
  )

  const rejectedCount = useMemo(
    () => refunds.filter((refund) => refund.status === "REJECTED").length,
    [refunds],
  )

  const pendingExposure = useMemo(
    () => refunds
      .filter((refund) => refund.status === "PENDING")
      .reduce((sum, refund) => sum + toNumber(refund.amount), 0),
    [refunds],
  )

  async function processRefund(refundId: string, status: Exclude<RefundStatus, "PENDING">) {
    setActionLoading(`refund:${refundId}:${status}`)
    try {
      const response = await authedFetch(`/admin/finance/refunds/${refundId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the refund request")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-background/50">
        <Header />
        <main className="relative flex-1 overflow-hidden px-4 py-8 md:px-8">
          <div className="fixed inset-0 pointer-events-none opacity-20">
            <PatternOverlay />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black">Refund Requests</h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {loading ? "Loading records…" : `Found ${refunds.length.toLocaleString()} ${getRefundStatusLabel(statusFilter)}`}
                </p>
              </div>
              <Link href="/admin" className="text-sm font-bold text-primary transition-colors hover:text-primary/80">
                ← Back to Overview
              </Link>
            </div>

            <GlassSurface variant="premium" className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="refund-search">
                  Search Query
                </label>
                <Input
                  id="refund-search"
                  placeholder="Search by request, customer, reason, or reference..."
                  value={query}
                  className="border-primary/20 bg-background/80 backdrop-blur-sm focus-visible:ring-primary"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="refund-status-filter">
                  Status Filter
                </label>
                <select
                  id="refund-status-filter"
                  className="block h-10 w-full rounded-md border border-primary/20 bg-background/80 px-3 text-sm outline-none backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof ALL_STATUSES | RefundStatus)}
                >
                  <option value={ALL_STATUSES}>All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="w-full md:w-48">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="refund-service-filter">
                  Service Filter
                </label>
                <select
                  id="refund-service-filter"
                  className="block h-10 w-full rounded-md border border-primary/20 bg-background/80 px-3 text-sm outline-none backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-primary"
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value as typeof ALL_SERVICES | RefundService)}
                >
                  <option value={ALL_SERVICES}>All services</option>
                  <option value="TRIP">Trip</option>
                  <option value="ORDER">Food Order</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
              <Button
                variant="ghost"
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => void loadData()}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </GlassSurface>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Undo2 className="h-4 w-4" /> Pending Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{pendingCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">Waiting for a finance decision</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pending Exposure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gold">{formatMoney(pendingExposure)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Total value still awaiting approval or rejection</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{approvedCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">Refunds already cleared for payout</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{rejectedCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">Requests closed without refund</p>
              </CardContent>
            </Card>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <Card className="glass-premium border-primary/10">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Refund Queue</CardTitle>
                  <p className="text-sm text-muted-foreground">Approve or reject customer refund requests directly from live finance data.</p>
                </div>
                <Badge variant="outline">{filteredRefunds.length} visible</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex min-h-[240px] items-center justify-center text-sm font-semibold text-muted-foreground">
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading refund requests...
                  </div>
                ) : filteredRefunds.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No refund requests match the current filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 font-black">Request</th>
                          <th className="px-6 py-4 font-black">Customer</th>
                          <th className="px-6 py-4 font-black">Service</th>
                          <th className="px-6 py-4 font-black">Amount</th>
                          <th className="px-6 py-4 font-black">Reason</th>
                          <th className="px-6 py-4 font-black">Status</th>
                          <th className="px-6 py-4 text-right font-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRefunds.map((refund) => {
                          const service = getRefundService(refund)
                          const customerName = refund.user.name ?? refund.user.phone ?? "Unknown user"

                          return (
                            <tr key={refund.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                              <td className="px-6 py-4">
                                <div className="font-mono text-xs">{refund.id}</div>
                                <div className="mt-1 text-xs text-muted-foreground">Ref {getRefundReference(refund)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold">{customerName}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(refund.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">{getServiceLabel(service)}</Badge>
                              </td>
                              <td className="px-6 py-4 font-bold text-gold">{formatMoney(refund.amount)}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">{refund.reason}</td>
                              <td className="px-6 py-4">
                                <Badge variant={statusVariant(refund.status)}>{refund.status}</Badge>
                                {refund.processedAt ? (
                                  <div className="mt-2 text-xs text-muted-foreground">Processed {formatDate(refund.processedAt)}</div>
                                ) : null}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {refund.status === "PENDING" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => void processRefund(refund.id, "APPROVED")}
                                      disabled={actionLoading === `refund:${refund.id}:APPROVED`}
                                    >
                                      {actionLoading === `refund:${refund.id}:APPROVED` ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void processRefund(refund.id, "REJECTED")}
                                      disabled={actionLoading === `refund:${refund.id}:REJECTED`}
                                    >
                                      {actionLoading === `refund:${refund.id}:REJECTED` ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Processed</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
