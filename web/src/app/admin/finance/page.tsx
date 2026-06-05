"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BodyMd, HeadingLg } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
import { Banknote, Check, HandCoins, LoaderCircle, RefreshCcw, TrendingUp, Undo2, X } from "lucide-react"

type FinanceAnalytics = {
  outstandingReceivables: number
  totalCashCollected: number
  totalPlatformRevenue: number
  activeRefunds: number
}

type CommissionRule = {
  id: string
  serviceType: string
  commissionType: "FIXED" | "PERCENTAGE"
  value: number | string
  cityId?: string | null
  isActive: boolean
  createdAt: string
}

type SettlementStatus = "PENDING" | "PARTIAL" | "COMPLETED" | "OVERDUE"

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

type RefundStatus = "PENDING" | "APPROVED" | "REJECTED"

type RefundRequest = {
  id: string
  tripId?: string | null
  orderId?: string | null
  deliveryId?: string | null
  amount: number | string
  reason: string
  status: RefundStatus
  createdAt: string
  user: {
    name?: string | null
    phone?: string | null
  }
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

function statusVariant(status: string) {
  if (status === "COMPLETED" || status === "APPROVED") return "default" as const
  if (status === "PARTIAL" || status === "PENDING") return "secondary" as const
  if (status === "OVERDUE" || status === "REJECTED") return "destructive" as const
  return "outline" as const
}

function getSettlementParty(settlement: Settlement) {
  if (settlement.fleet) {
    return settlement.fleet.companyName ?? settlement.fleet.ownerName ?? settlement.fleet.phone ?? "Unknown fleet"
  }

  return settlement.user?.name ?? settlement.user?.phone ?? "Unknown driver"
}

function getRefundService(refund: RefundRequest) {
  if (refund.tripId) return "Trip"
  if (refund.orderId) return "Food Order"
  if (refund.deliveryId) return "Delivery"
  return "Unknown"
}

function getOutstandingAmount(settlement: Settlement) {
  return Math.max(0, toNumber(settlement.netBalance) * -1)
}

export default function FinanceDashboardPage() {
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null)
  const [commissions, setCommissions] = useState<CommissionRule[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settlementStatus, setSettlementStatus] = useState<typeof ALL_SETTLEMENTS | SettlementStatus>(ALL_SETTLEMENTS)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [collectForm, setCollectForm] = useState<CollectCashForm>(EMPTY_COLLECT_FORM)
  const [collectError, setCollectError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const settlementPath = settlementStatus === ALL_SETTLEMENTS
        ? "/admin/finance/settlements"
        : `/admin/finance/settlements?status=${settlementStatus}`

      const [analyticsResponse, commissionsResponse, settlementsResponse, refundsResponse] = await Promise.all([
        authedFetch("/admin/finance/analytics"),
        authedFetch("/admin/finance/commissions"),
        authedFetch(settlementPath),
        authedFetch("/admin/finance/refunds"),
      ])

      if (!analyticsResponse.ok) throw new Error(await getErrorMessage(analyticsResponse))
      if (!commissionsResponse.ok) throw new Error(await getErrorMessage(commissionsResponse))
      if (!settlementsResponse.ok) throw new Error(await getErrorMessage(settlementsResponse))
      if (!refundsResponse.ok) throw new Error(await getErrorMessage(refundsResponse))

      const [analyticsData, commissionData, settlementData, refundData] = await Promise.all([
        analyticsResponse.json() as Promise<FinanceAnalytics>,
        commissionsResponse.json() as Promise<CommissionRule[]>,
        settlementsResponse.json() as Promise<Settlement[]>,
        refundsResponse.json() as Promise<RefundRequest[]>,
      ])

      setAnalytics(analyticsData)
      setCommissions(Array.isArray(commissionData) ? commissionData : [])
      setSettlements(Array.isArray(settlementData) ? settlementData : [])
      setRefunds(Array.isArray(refundData) ? refundData : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance dashboard")
    } finally {
      setLoading(false)
    }
  }, [settlementStatus])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const pendingRefunds = useMemo(
    () => refunds.filter((refund) => refund.status === "PENDING"),
    [refunds],
  )

  const settlementSummary = useMemo(
    () => ({
      receivableCount: settlements.filter((settlement) => getOutstandingAmount(settlement) > 0).length,
      completedCount: settlements.filter((settlement) => settlement.status === "COMPLETED").length,
    }),
    [settlements],
  )
  const isCollectingCash = actionLoading?.startsWith("collect:") ?? false

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
        <main className="container flex-1 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Banknote className="h-8 w-8 text-primary" />
                Finance Control Center
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Track receivables, collect settlement cash, review refund requests, and audit commission rules from live backend data.
              </BodyMd>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="finance-settlement-status">Settlement status</label>
              <select
                id="finance-settlement-status"
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
                <p className="mt-1 text-xs text-muted-foreground">{settlementSummary.receivableCount} open settlements still owe the platform</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Banknote className="h-4 w-4" /> Total Cash Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{formatMoney(analytics?.totalCashCollected)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Recorded across all settlement collections</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" /> Platform Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gold">{formatMoney(analytics?.totalPlatformRevenue)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Live finance dashboard revenue snapshot</p>
              </CardContent>
            </Card>

            <Card className="glass-premium border-primary/10 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Undo2 className="h-4 w-4" /> Pending Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{analytics?.activeRefunds ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">{settlementSummary.completedCount} settlements already closed cleanly</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-primary/10 bg-background/70">
              <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Loading finance control center...
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Card className="glass-premium border-primary/10">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Settlement Ledger</CardTitle>
                      <p className="text-sm text-muted-foreground">Filterable live settlements with direct cash collection for open receivables.</p>
                    </div>
                    <Badge variant="outline">{settlements.length} records</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {settlements.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">No settlements found for the selected filter.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="px-6 py-4 font-black">Party</th>
                              <th className="px-6 py-4 font-black">Period</th>
                              <th className="px-6 py-4 font-black">Net Balance</th>
                              <th className="px-6 py-4 font-black">Collected</th>
                              <th className="px-6 py-4 font-black">Status</th>
                              <th className="px-6 py-4 text-right font-black">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {settlements.map((settlement) => {
                              const amountDue = getOutstandingAmount(settlement)

                              return (
                                <tr key={settlement.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold">{getSettlementParty(settlement)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Earned {formatMoney(settlement.totalEarned)} · Fee {formatMoney(settlement.platformFee)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-muted-foreground">
                                    {formatDate(settlement.periodStart)}
                                    <div className="mt-1">to {formatDate(settlement.periodEnd)}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className={toNumber(settlement.netBalance) < 0 ? "font-bold text-red-500" : "font-bold text-primary"}>
                                      {formatMoney(settlement.netBalance)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {amountDue > 0 ? `${formatMoney(amountDue)} due to platform` : "Platform owes or account is settled"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium">{formatMoney(settlement.cashCollected)}</td>
                                  <td className="px-6 py-4">
                                    <Badge variant={statusVariant(settlement.status)}>{settlement.status}</Badge>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {amountDue > 0 ? (
                                      <Button size="sm" onClick={() => openCollectDialog(settlement)} disabled={Boolean(actionLoading)}>
                                        Collect Cash
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No collection needed</span>
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
                      <CardTitle>Refund Queue</CardTitle>
                      <p className="text-sm text-muted-foreground">Approve or reject customer refund requests directly from live finance data.</p>
                    </div>
                    <Badge variant="outline">{pendingRefunds.length} pending</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {refunds.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">No refund requests found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="px-6 py-4 font-black">Requester</th>
                              <th className="px-6 py-4 font-black">Service</th>
                              <th className="px-6 py-4 font-black">Amount</th>
                              <th className="px-6 py-4 font-black">Reason</th>
                              <th className="px-6 py-4 font-black">Status</th>
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
                                <td className="px-6 py-4">
                                  <Badge variant="outline">{getRefundService(refund)}</Badge>
                                </td>
                                <td className="px-6 py-4 font-bold text-gold">{formatMoney(refund.amount)}</td>
                                <td className="px-6 py-4 text-xs text-muted-foreground">{refund.reason}</td>
                                <td className="px-6 py-4">
                                  <Badge variant={statusVariant(refund.status)}>{refund.status}</Badge>
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-premium border-primary/10">
                  <CardHeader>
                    <CardTitle>Commission Rules</CardTitle>
                    <p className="text-sm text-muted-foreground">Live commission configuration currently applied across services.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {commissions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-primary/10 p-4 text-sm text-muted-foreground">
                        No commission rules are configured yet.
                      </div>
                    ) : (
                      commissions.map((rule) => (
                        <div key={rule.id} className="rounded-xl border border-primary/10 bg-background/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold">{rule.serviceType}</div>
                              <div className="text-xs text-muted-foreground">{rule.cityId ? `City ${rule.cityId}` : "Global rule"} · Created {formatDate(rule.createdAt)}</div>
                            </div>
                            <Badge variant={rule.isActive ? "default" : "outline"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            {rule.commissionType === "PERCENTAGE" ? `${toNumber(rule.value)}% commission` : `${formatMoney(rule.value)} fixed commission`}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-premium border-primary/10">
                  <CardHeader>
                    <CardTitle>Ops Snapshot</CardTitle>
                    <p className="text-sm text-muted-foreground">Quick view of what needs attention in finance right now.</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/60 p-4">
                      <span>Refunds waiting for decision</span>
                      <span className="font-bold">{pendingRefunds.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/60 p-4">
                      <span>Filtered settlement records</span>
                      <span className="font-bold">{settlements.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/60 p-4">
                      <span>Commission rules configured</span>
                      <span className="font-bold">{commissions.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={Boolean(selectedSettlement)} onOpenChange={closeCollectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect settlement cash</DialogTitle>
            <DialogDescription>
              {selectedSettlement
                ? `Record the amount collected from ${getSettlementParty(selectedSettlement)} for this settlement.`
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
                placeholder="Optional notes for the cashier or audit log"
              />
            </label>

            {collectError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {collectError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => void submitCashCollection()} disabled={isCollectingCash}>
              {isCollectingCash ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Record collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
