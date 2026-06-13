"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCcw,
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { GlassSurface } from "@/components/ui/glass-surface"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"

type RefundStatus = "PENDING" | "APPROVED" | "REJECTED"
type RefundService = "TRIP" | "ORDER" | "DELIVERY" | "UNKNOWN"

type RefundRequest = {
  id: string
  userId: string
  amount: number | string
  reason: string
  status: RefundStatus
  createdAt: string
  processedAt?: string | null
  user: { name?: string | null; phone?: string | null; email?: string | null }
  orderId?: string | null
  tripId?: string | null
  deliveryId?: string | null
}

const ALL_STATUSES = "ALL" as const
const ALL_SERVICES = "ALL" as const

export default function AdminRefundsPage() {
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<typeof ALL_STATUSES | RefundStatus>(ALL_STATUSES)
  const [serviceFilter] = useState<typeof ALL_SERVICES | RefundService>(ALL_SERVICES)
  const [actionLoading, setActionLoading] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authedFetch("/admin/finance/refunds")
      if (!res.ok) throw new Error("Failed to fetch refunds")
      setRefunds(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const processRefund = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(`refund:${id}:${status}`)
    try {
      const res = await authedFetch(`/admin/finance/refunds/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Processing failed")
      await loadData()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setActionLoading("")
    }
  }

  const formatMoney = (v: number | string) => `${Number(v).toLocaleString()} AFN`
  const formatDate = (v: string) => new Date(v).toLocaleString()

  const getRefundService = (r: RefundRequest): RefundService => {
    if (r.tripId) return "TRIP"
    if (r.orderId) return "ORDER"
    if (r.deliveryId) return "DELIVERY"
    return "UNKNOWN"
  }

  const filteredRefunds = refunds.filter(r => {
    const s = getRefundService(r)
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user.phone ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === ALL_STATUSES || r.status === statusFilter
    const matchesService = serviceFilter === ALL_SERVICES || s === serviceFilter
    return matchesSearch && matchesStatus && matchesService
  })

  const pendingCount = refunds.filter(r => r.status === "PENDING").length
  const pendingExposure = refunds.filter(r => r.status === "PENDING").reduce((a, b) => a + Number(b.amount), 0)

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Refund Management"
            subtitle="Approve or reject customer refund requests across all services."
            actions={
              <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassSurface variant="premium" className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Search Requests</label>
                <Input
                  placeholder="ID, customer name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-background/80 backdrop-blur-sm border-primary/20"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Status</label>
                <select
                  className="block w-full rounded-md border border-primary/20 bg-background/80 px-3 py-2 text-sm outline-none backdrop-blur-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </GlassSurface>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/10 glass-premium">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Requests</p>
                <p className="mt-2 text-3xl font-black">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 glass-premium">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Exposure</p>
                <p className="mt-2 text-3xl font-black text-gold">{formatMoney(pendingExposure)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Request</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Accessing finance records...</td></tr>
                    ) : filteredRefunds.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No refund requests found.</td></tr>
                    ) : (
                      filteredRefunds.map((r) => (
                        <tr key={r.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors align-top">
                          <td className="px-6 py-4">
                            <div className="font-mono text-[10px] text-muted-foreground">{r.id.slice(-12)}</div>
                            <div className="text-xs mt-1 text-muted-foreground max-w-[120px] truncate">{r.reason}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold">{r.user.name ?? r.user.phone ?? "Unknown"}</div>
                            <div className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold uppercase">{getRefundService(r)}</td>
                          <td className="px-6 py-4 font-black text-gold">{formatMoney(r.amount)}</td>
                          <td className="px-6 py-4">
                            <Badge variant={r.status === "APPROVED" ? "default" : r.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {r.status === "PENDING" ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={() => processRefund(r.id, "APPROVED")} disabled={Boolean(actionLoading)}>Approve</Button>
                                <Button size="sm" variant="outline" onClick={() => processRefund(r.id, "REJECTED")} disabled={Boolean(actionLoading)}>Reject</Button>
                              </div>
                            ) : <span className="text-[10px] font-bold uppercase text-muted-foreground">Processed</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}

import { motion } from "framer-motion"
