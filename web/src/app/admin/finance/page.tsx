"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  DollarSign,
  Wallet,
  RefreshCw,
  FileText
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

type Settlement = {
  id: string
  partyId: string
  amount: number | string
  status: string
  type: string
  createdAt: string
  user?: { name: string; phone: string } | null
  fleet?: { name: string } | null
}

type RefundRequest = {
  id: string
  userId: string
  amount: number | string
  reason: string
  status: string
  createdAt: string
  user: { name: string; phone: string }
  order?: { id: string } | null
  trip?: { id: string } | null
  delivery?: { id: string } | null
}

type CommissionRule = {
  id: string
  serviceType: string
  cityId?: string | null
  commissionType: string
  value: number | string
  isActive: boolean
  createdAt: string
}

export default function AdminFinancePage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [commissions, setCommissions] = useState<CommissionRule[]>([])
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [collectForm, setCollectForm] = useState({ amount: "", receiptNo: "", notes: "" })
  const [collectError, setCollectError] = useState("")
  const [isCollectingCash, setIsCollectingCash] = useState(false)
  const [actionLoading, setActionLoading] = useState("")

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [setRes, refRes, comRes] = await Promise.all([
        authedFetch("/admin/finance/settlements?limit=50"),
        authedFetch("/admin/finance/refunds?status=PENDING"),
        authedFetch("/admin/finance/commissions")
      ])

      if (setRes.ok) setSettlements(await setRes.json())
      if (refRes.ok) setRefunds(await refRes.json())
      if (comRes.ok) setCommissions(await comRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const formatMoney = (amount: string | number) => {
    return `${Number(amount).toLocaleString()} AFN`
  }

  const formatDate = (date: string) => new Date(date).toLocaleString()

  const getSettlementParty = (s: Settlement) => {
    return s.user?.name ?? s.user?.phone ?? s.fleet?.name ?? "Unknown Party"
  }

  const processRefund = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(`refund:${id}:${status}`)
    try {
      const res = await authedFetch(`/admin/finance/refunds/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Failed to process refund")
      setRefunds(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setActionLoading("")
    }
  }

  const openCollectDialog = (s: Settlement) => {
    setSelectedSettlement(s)
    setCollectForm({ amount: String(s.amount), receiptNo: "", notes: "" })
    setCollectError("")
  }

  const closeCollectDialog = () => {
    setSelectedSettlement(null)
    setCollectForm({ amount: "", receiptNo: "", notes: "" })
  }

  const submitCashCollection = async () => {
    if (!selectedSettlement) return
    setIsCollectingCash(true)
    setCollectError("")

    try {
      const res = await authedFetch(`/admin/finance/settlements/${selectedSettlement.id}/collect`, {
        method: "POST",
        body: JSON.stringify(collectForm)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to record collection")
      }

      await load(true)
      closeCollectDialog()
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsCollectingCash(false)
    }
  }

  const pendingRefunds = refunds.filter(r => r.status === "PENDING")
  const totalOutstanding = settlements.reduce((acc, s) => acc + Number(s.amount), 0)

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Financial Operations"
            subtitle="Manage settlements, refund requests, and commission rules."
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Outstanding</p>
                    <p className="mt-1 text-2xl font-black text-gold">{formatMoney(totalOutstanding)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Pending Refunds</p>
                    <p className="mt-1 text-2xl font-black">{pendingRefunds.length}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Revenue Today</p>
                    <p className="mt-1 text-2xl font-black">0 AFN</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Active Rules</p>
                    <p className="mt-1 text-2xl font-black">{commissions.filter(c => c.isActive).length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card className="border-primary/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Settlements</CardTitle>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">View all</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 font-black">Party</th>
                          <th className="px-6 py-4 font-black">Amount</th>
                          <th className="px-6 py-4 font-black">Type</th>
                          <th className="px-6 py-4 font-black">Status</th>
                          <th className="px-6 py-4 text-right font-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Scanning ledgers...</td></tr>
                        ) : settlements.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No recent settlements found.</td></tr>
                        ) : (
                          settlements.map((s) => (
                            <tr key={s.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                              <td className="px-6 py-4">
                                <div className="font-semibold">{getSettlementParty(s)}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-gold">{formatMoney(s.amount)}</td>
                              <td className="px-6 py-4 text-xs font-medium">{s.type}</td>
                              <td className="px-6 py-4">
                                <Badge variant={s.status === "PAID" ? "default" : "secondary"}>{s.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {s.status === "UNPAID" && (
                                  <Button size="sm" variant="outline" onClick={() => openCollectDialog(s)} className="border-primary/20 hover:bg-primary/10 text-primary">
                                    <DollarSign className="mr-2 h-3 w-3" />
                                    Collect
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Pending Refund Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {refunds.length === 0 ? (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                      No pending refund requests needing review.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-6 py-4 font-black">Requester</th>
                            <th className="px-6 py-4 font-black">Amount</th>
                            <th className="px-6 py-4 font-black">Reason</th>
                            <th className="px-6 py-4 text-right font-black">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refunds.map((refund) => (
                            <tr key={refund.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                              <td className="px-6 py-4">
                                <div className="font-semibold">{refund.user.name ?? refund.user.phone ?? "Unknown user"}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(refund.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-gold">{formatMoney(refund.amount)}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">{refund.reason}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" onClick={() => void processRefund(refund.id, "APPROVED")} disabled={Boolean(actionLoading)}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => void processRefund(refund.id, "REJECTED")} disabled={Boolean(actionLoading)}>
                                    Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase">Commission Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {commissions.map((rule) => (
                    <div key={rule.id} className="rounded-xl border border-primary/10 bg-background/60 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{rule.serviceType}</div>
                        <Badge variant={rule.isActive ? "default" : "outline"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {rule.commissionType === "PERCENTAGE" ? `${rule.value}% commission` : `${formatMoney(rule.value)} fixed`}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selectedSettlement)} onOpenChange={closeCollectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect settlement cash</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Amount (AFN)</label>
              <Input type="number" value={collectForm.amount} onChange={(e) => setCollectForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Receipt Number</label>
              <Input value={collectForm.receiptNo} onChange={(e) => setCollectForm(f => ({ ...f, receiptNo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Notes</label>
              <Input value={collectForm.notes} onChange={(e) => setCollectForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {collectError && <div className="text-sm text-destructive">{collectError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={submitCashCollection} disabled={isCollectingCash}>
              Record collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
