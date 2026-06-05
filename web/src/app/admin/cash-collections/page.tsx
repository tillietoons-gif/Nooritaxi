"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BodyMd } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
import { HandCoins, History, LoaderCircle, ReceiptText, RefreshCcw } from "lucide-react"

type SettlementStatus = "PENDING" | "PARTIAL" | "COMPLETED" | "OVERDUE"

type FinanceAnalytics = {
  outstandingReceivables: number
  totalCashCollected: number
}

type Settlement = {
  id: string
  userId?: string | null
  fleetId?: string | null
  periodStart: string
  periodEnd: string
  totalEarned: number | string
  platformFee: number | string
  cashCollected: number | string
  netBalance: number | string
  status: SettlementStatus
  notes?: string | null
  user?: {
    name?: string | null
    phone?: string | null
  } | null
  fleet?: {
    companyName?: string | null
    ownerName?: string | null
    phone?: string | null
  } | null
}

type CashCollection = {
  id: string
  settlementId?: string | null
  amount: number | string
  receiptNo?: string | null
  notes?: string | null
  collectedAt: string
  admin?: {
    name?: string | null
    phone?: string | null
    email?: string | null
  } | null
  settlement?: Settlement | null
}

type CollectCashForm = {
  amount: string
  receiptNo: string
  notes: string
}

const ALL_SETTLEMENTS = "ALL"

const EMPTY_COLLECT_FORM: CollectCashForm = {
  amount: "",
  receiptNo: "",
  notes: "",
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

function statusVariant(status: SettlementStatus) {
  if (status === "OVERDUE") return "destructive" as const
  if (status === "PARTIAL" || status === "PENDING") return "secondary" as const
  return "default" as const
}

function getSettlementParty(settlement: Settlement) {
  if (settlement.fleet) {
    return settlement.fleet.companyName ?? settlement.fleet.ownerName ?? settlement.fleet.phone ?? "Unknown fleet"
  }

  return settlement.user?.name ?? settlement.user?.phone ?? "Unknown driver"
}

function getOutstandingAmount(settlement: Settlement) {
  return Math.max(0, toNumber(settlement.netBalance) * -1)
}

export default function CashCollectionsPage() {
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [collections, setCollections] = useState<CashCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settlementStatus, setSettlementStatus] = useState<typeof ALL_SETTLEMENTS | SettlementStatus>(ALL_SETTLEMENTS)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [collectForm, setCollectForm] = useState<CollectCashForm>(EMPTY_COLLECT_FORM)
  const [collectError, setCollectError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const settlementsPath = settlementStatus === ALL_SETTLEMENTS
        ? "/admin/finance/settlements"
        : `/admin/finance/settlements?status=${settlementStatus}`

      const [analyticsResponse, settlementsResponse, collectionsResponse] = await Promise.all([
        authedFetch("/admin/finance/analytics"),
        authedFetch(settlementsPath),
        authedFetch("/admin/finance/cash-collections?limit=100"),
      ])

      if (!analyticsResponse.ok) throw new Error(await getErrorMessage(analyticsResponse))
      if (!settlementsResponse.ok) throw new Error(await getErrorMessage(settlementsResponse))
      if (!collectionsResponse.ok) throw new Error(await getErrorMessage(collectionsResponse))

      const [analyticsData, settlementsData, collectionsData] = await Promise.all([
        analyticsResponse.json() as Promise<FinanceAnalytics>,
        settlementsResponse.json() as Promise<Settlement[]>,
        collectionsResponse.json() as Promise<CashCollection[]>,
      ])

      setAnalytics(analyticsData)
      setSettlements(Array.isArray(settlementsData) ? settlementsData : [])
      setCollections(Array.isArray(collectionsData) ? collectionsData : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cash collections")
    } finally {
      setLoading(false)
    }
  }, [settlementStatus])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const collectibleSettlements = useMemo(
    () => settlements.filter((settlement) => getOutstandingAmount(settlement) > 0),
    [settlements],
  )

  const overdueCount = useMemo(
    () => settlements.filter((settlement) => settlement.status === "OVERDUE").length,
    [settlements],
  )

  const isCollecting = actionLoading?.startsWith("collect:") ?? false

  function openCollectDialog(settlement: Settlement) {
    setSelectedSettlement(settlement)
    setCollectForm({
      amount: String(getOutstandingAmount(settlement)),
      receiptNo: "",
      notes: settlement.notes ?? "",
    })
    setCollectError(null)
  }

  function closeCollectDialog(open: boolean) {
    if (!open) {
      setSelectedSettlement(null)
      setCollectForm(EMPTY_COLLECT_FORM)
      setCollectError(null)
    }
  }

  async function submitCashCollection() {
    if (!selectedSettlement) return

    const amount = Number(collectForm.amount)
    const collectedFrom = selectedSettlement.userId ?? selectedSettlement.fleetId

    if (!Number.isFinite(amount) || amount <= 0) {
      setCollectError("Enter a valid amount greater than zero")
      return
    }

    if (!collectedFrom) {
      setCollectError("This settlement is missing a finance owner and cannot be collected yet")
      return
    }

    setActionLoading(`collect:${selectedSettlement.id}`)
    setCollectError(null)
    try {
      const response = await authedFetch("/admin/finance/collect-cash", {
        method: "POST",
        body: JSON.stringify({
          settlementId: selectedSettlement.id,
          amount,
          collectedFrom,
          receiptNo: collectForm.receiptNo.trim() || undefined,
          notes: collectForm.notes.trim() || undefined,
        }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      closeCollectDialog(false)
      await loadData()
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : "Failed to record the cash collection")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-background/50">
        <Header />
        <main className="container flex-1 py-8">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black">Cash Collections</h1>
              <BodyMd className="mt-1 text-sm font-medium text-muted-foreground">
                {loading
                  ? "Loading records…"
                  : `Found ${collections.length.toLocaleString()} collection entries and ${settlements.length.toLocaleString()} settlement records`}
              </BodyMd>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <label className="sr-only" htmlFor="cash-collection-status">Settlement status</label>
              <select
                id="cash-collection-status"
                aria-label="Settlement status"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                value={settlementStatus}
                onChange={(event) => setSettlementStatus(event.target.value as typeof ALL_SETTLEMENTS | SettlementStatus)}
              >
                <option value={ALL_SETTLEMENTS}>All settlements</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Link href="/admin" className="text-sm font-bold text-primary transition-colors hover:text-primary/80">
                ← Back to Overview
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HandCoins className="h-4 w-4" /> Outstanding Receivables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-500">{formatMoney(analytics?.outstandingReceivables)}</div>
                <p className="mt-1 text-xs text-muted-foreground">{collectibleSettlements.length} settlements still need collection</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ReceiptText className="h-4 w-4" /> Total Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{formatMoney(analytics?.totalCashCollected)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Across all recorded collection entries</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <History className="h-4 w-4" /> Recent Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{collections.length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Loaded from the latest 100 collection records</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HandCoins className="h-4 w-4" /> Overdue Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{overdueCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">Overdue settlements need priority follow-up</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-primary/10 bg-background/70">
              <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Loading cash collections...
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="glass-premium border-primary/10">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Collectible Settlements</CardTitle>
                    <p className="text-sm text-muted-foreground">Record new cash collections against unsettled balances.</p>
                  </div>
                  <Badge variant="outline">{settlements.length} visible settlements</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {settlements.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No settlements found for the selected filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-6 py-4 font-black">Settlement</th>
                            <th className="px-6 py-4 font-black">Party</th>
                            <th className="px-6 py-4 font-black">Outstanding</th>
                            <th className="px-6 py-4 font-black">Status</th>
                            <th className="px-6 py-4 text-right font-black">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settlements.map((settlement) => {
                            const outstanding = getOutstandingAmount(settlement)

                            return (
                              <tr key={settlement.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                                <td className="px-6 py-4">
                                  <div className="font-mono text-xs text-muted-foreground">{settlement.id}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">{formatDate(settlement.periodStart)} to {formatDate(settlement.periodEnd)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold">{getSettlementParty(settlement)}</div>
                                  <div className="text-xs text-muted-foreground">Collected so far {formatMoney(settlement.cashCollected)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={outstanding > 0 ? "font-bold text-red-500" : "font-bold text-primary"}>
                                    {formatMoney(outstanding)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Net balance {formatMoney(settlement.netBalance)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant={statusVariant(settlement.status)}>{settlement.status}</Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {outstanding > 0 ? (
                                    <Button size="sm" onClick={() => openCollectDialog(settlement)}>
                                      Record Collection
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Settled</span>
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

              <Card className="glass-premium border-primary/10">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Collection History</CardTitle>
                    <p className="text-sm text-muted-foreground">Recent cash receipts recorded by finance admins.</p>
                  </div>
                  <Badge variant="outline">{collections.length} entries</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {collections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-primary/10 p-4 text-sm text-muted-foreground">
                      No cash collections have been recorded yet.
                    </div>
                  ) : (
                    collections.map((collection) => (
                      <div key={collection.id} className="rounded-xl border border-primary/10 bg-background/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{collection.settlement ? getSettlementParty(collection.settlement) : (collection.receiptNo ?? collection.id)}</div>
                            <div className="text-xs text-muted-foreground">
                              {collection.settlementId ? `Settlement ${collection.settlementId}` : "Manual collection record"} · {formatDate(collection.collectedAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">{formatMoney(collection.amount)}</div>
                            <div className="text-xs text-muted-foreground">{collection.receiptNo ? `Receipt ${collection.receiptNo}` : "No receipt reference"}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Collected by {collection.admin?.name ?? collection.admin?.phone ?? collection.admin?.email ?? "Unknown admin"}
                        </div>
                        {collection.notes ? <div className="mt-2 text-xs text-muted-foreground">{collection.notes}</div> : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <Dialog open={Boolean(selectedSettlement)} onOpenChange={closeCollectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record collection</DialogTitle>
            <DialogDescription>
              {selectedSettlement
                ? `Record the cash received from ${getSettlementParty(selectedSettlement)} for settlement ${selectedSettlement.id}.`
                : "Record a cash collection against this settlement."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <label className="block text-sm font-medium text-foreground">
              <span className="mb-2 block">Amount</span>
              <Input
                aria-label="Collection amount"
                type="number"
                min="1"
                step="0.01"
                value={collectForm.amount}
                onChange={(event) => setCollectForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              <span className="mb-2 block">Receipt number</span>
              <Input
                aria-label="Receipt number"
                value={collectForm.receiptNo}
                onChange={(event) => setCollectForm((current) => ({ ...current, receiptNo: event.target.value }))}
                placeholder="Optional receipt reference"
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              <span className="mb-2 block">Notes</span>
              <textarea
                aria-label="Collection notes"
                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={collectForm.notes}
                onChange={(event) => setCollectForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional notes for cashier handoff"
              />
            </label>

            {collectError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {collectError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => void submitCashCollection()} disabled={isCollecting}>
              {isCollecting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
