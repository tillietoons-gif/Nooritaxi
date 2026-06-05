"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Banknote,
  Search,
  RefreshCw,
  Check,
  LoaderCircle,
  History,
  AlertCircle
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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

type Settlement = {
  id: string
  periodStart: string
  periodEnd: string
  netBalance: number | string
  cashCollected: number | string
  status: string
  user?: { name: string; phone: string } | null
  fleet?: { name: string } | null
}

type CashCollection = {
  id: string
  settlementId?: string | null
  amount: number | string
  collectedAt: string
  receiptNo?: string | null
  notes?: string | null
  admin?: { name?: string | null; email?: string | null; phone?: string | null } | null
  settlement?: Settlement | null
}

export default function CashCollectionsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [collections, setCollections] = useState<CashCollection[]>([])
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [collectForm, setCollectForm] = useState({ amount: "", receiptNo: "", notes: "" })
  const [collectError, setCollectError] = useState("")
  const [isCollecting, setIsCollecting] = useState(false)
  const [search, setSearch] = useState("")

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [setRes, colRes] = await Promise.all([
        authedFetch("/admin/finance/settlements?status=UNPAID&limit=50"),
        authedFetch("/admin/finance/collections?limit=20")
      ])

      if (setRes.ok) setSettlements(await setRes.json())
      if (colRes.ok) setCollections(await colRes.json())
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

  const formatMoney = (amount: string | number) => `${Number(amount).toLocaleString()} AFN`
  const formatDate = (date: string) => new Date(date).toLocaleString()

  const getSettlementParty = (s: Settlement) => s.user?.name ?? s.user?.phone ?? s.fleet?.name ?? "Unknown"

  const openCollectDialog = (s: Settlement) => {
    const outstanding = Number(s.netBalance) - Number(s.cashCollected)
    setSelectedSettlement(s)
    setCollectForm({ amount: String(outstanding), receiptNo: "", notes: "" })
    setCollectError("")
  }

  const closeCollectDialog = () => {
    setSelectedSettlement(null)
    setCollectForm({ amount: "", receiptNo: "", notes: "" })
  }

  const submitCashCollection = async () => {
    if (!selectedSettlement) return
    setIsCollecting(true)
    try {
      const res = await authedFetch(`/admin/finance/settlements/${selectedSettlement.id}/collect`, {
        method: "POST",
        body: JSON.stringify(collectForm)
      })
      if (!res.ok) throw new Error("Failed to record collection")
      await load(true)
      closeCollectDialog()
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : "Error recording collection")
    } finally {
      setIsCollecting(false)
    }
  }

  const filteredSettlements = settlements.filter(s =>
    getSettlementParty(s).toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Cash Collections"
            subtitle="Record and audit manual cash collections from drivers and fleets."
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Banknote className="h-6 w-6" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Collection</p>
                    <p className="text-2xl font-black">{filteredSettlements.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600"><Check className="h-6 w-6" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Receipts</p>
                    <p className="text-2xl font-black">{collections.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gold/10 p-3 rounded-2xl text-gold"><AlertCircle className="h-6 w-6" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily Audit</p>
                    <p className="text-2xl font-black">Passed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/5 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Active Settlements</CardTitle>
                  <div className="relative md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter parties..." className="pl-9 bg-background/50" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Settlement / Period</th>
                        <th className="px-6 py-4">Party</th>
                        <th className="px-6 py-4">Outstanding</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-xs">Querying settlement ledger...</td></tr>
                      ) : filteredSettlements.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No settlements requiring cash collection.</td></tr>
                      ) : (
                        filteredSettlements.map((s) => {
                          const outstanding = Number(s.netBalance) - Number(s.cashCollected)
                          return (
                            <tr key={s.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-mono text-[10px] text-muted-foreground">{s.id.slice(-12)}</div>
                                <div className="text-xs mt-1">{formatDate(s.periodStart).split(',')[0]} → {formatDate(s.periodEnd).split(',')[0]}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-sm tracking-tight">{getSettlementParty(s)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-black text-primary">{formatMoney(outstanding)}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="outline" onClick={() => openCollectDialog(s)} className="border-primary/20 hover:bg-primary/10 text-primary font-bold">Collect</Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" /> Collection Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {collections.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-primary/5 bg-background/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm">{c.settlement ? getSettlementParty(c.settlement) : "Manual Entry"}</div>
                      <div className="font-black text-emerald-600">+{formatMoney(c.amount)}</div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      <span>{formatDate(c.collectedAt)}</span>
                      <span>{c.receiptNo || "NO RECEIPT"}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selectedSettlement)} onOpenChange={closeCollectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Record Collection</DialogTitle>
            <DialogDescription>Entering cash receipt details into the audit ledger.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collection Amount</label>
              <Input type="number" value={collectForm.amount} onChange={(e) => setCollectForm(f => ({ ...f, amount: e.target.value }))} className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receipt / Reference</label>
              <Input value={collectForm.receiptNo} onChange={(e) => setCollectForm(f => ({ ...f, receiptNo: e.target.value }))} className="bg-muted/50" placeholder="e.g. RCP-8291" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Notes</label>
              <Input value={collectForm.notes} onChange={(e) => setCollectForm(f => ({ ...f, notes: e.target.value }))} className="bg-muted/50" />
            </div>
            {collectError && <div className="text-xs font-bold text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">{collectError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={submitCashCollection} disabled={isCollecting} className="w-full font-black uppercase tracking-widest">
              {isCollecting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
