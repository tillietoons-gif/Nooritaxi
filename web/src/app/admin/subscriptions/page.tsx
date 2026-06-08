"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, CalendarClock, CheckCircle2, Crown, LoaderCircle, Plus, RefreshCw, Users } from "lucide-react"

type SubscriptionPlanType = "DRIVER" | "MERCHANT" | "USER_VIP"
type SubscriptionBillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY"

type SubscriptionPlan = {
  id: string
  name: string
  description?: string | null
  type: SubscriptionPlanType
  price: string | number
  billingCycle: SubscriptionBillingCycle
  features: unknown
  isActive: boolean
  createdAt: string
}

type ActiveSubscription = {
  id: string
  planId: string
  startDate: string
  endDate: string
  status: string
  autoRenew: boolean
  plan: SubscriptionPlan
  user?: { name?: string | null; phone?: string | null } | null
  driver?: { user?: { name?: string | null; phone?: string | null } | null } | null
  merchant?: { name?: string | null } | null
}

type PlanFormState = {
  name: string
  description: string
  type: SubscriptionPlanType
  price: string
  billingCycle: SubscriptionBillingCycle
  features: string
  isActive: boolean
}

const EMPTY_FORM: PlanFormState = {
  name: "",
  description: "",
  type: "DRIVER",
  price: "",
  billingCycle: "MONTHLY",
  features: "",
  isActive: true,
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

function formatMoney(value: string | number) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "AFN 0"
  return `AFN ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatCycle(cycle: SubscriptionBillingCycle) {
  return cycle.charAt(0) + cycle.slice(1).toLowerCase()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function planFeatures(features: unknown) {
  if (Array.isArray(features)) return features.map(String)
  if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      return features ? [features] : []
    }
  }
  return []
}

function parseFeatureInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((feature) => feature.trim())
    .filter(Boolean)
}

function subscriberLabel(subscription: ActiveSubscription) {
  return (
    subscription.user?.name ||
    subscription.user?.phone ||
    subscription.driver?.user?.name ||
    subscription.driver?.user?.phone ||
    subscription.merchant?.name ||
    "Unassigned subscriber"
  )
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM)

  const activeCountByPlan = useMemo(() => {
    return activeSubscriptions.reduce<Record<string, number>>((counts, subscription) => {
      counts[subscription.planId] = (counts[subscription.planId] ?? 0) + 1
      return counts
    }, {})
  }, [activeSubscriptions])

  const totalActiveRevenue = useMemo(() => {
    return activeSubscriptions.reduce((total, subscription) => total + Number(subscription.plan.price ?? 0), 0)
  }, [activeSubscriptions])

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const [plansResponse, activeResponse] = await Promise.all([
        authedFetch("/admin/subscriptions/plans"),
        authedFetch("/admin/subscriptions/active"),
      ])

      if (!plansResponse.ok) throw new Error(await getErrorMessage(plansResponse))
      if (!activeResponse.ok) throw new Error(await getErrorMessage(activeResponse))

      const [plansData, activeData] = await Promise.all([
        plansResponse.json() as Promise<SubscriptionPlan[]>,
        activeResponse.json() as Promise<ActiveSubscription[]>,
      ])

      setPlans(Array.isArray(plansData) ? plansData : [])
      setActiveSubscriptions(Array.isArray(activeData) ? activeData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function closeDialog(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setForm(EMPTY_FORM)
      setSubmitError(null)
    }
  }

  async function createPlan() {
    const name = form.name.trim()
    const price = Number(form.price)

    if (!name) {
      setSubmitError("Plan name is required")
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      setSubmitError("Price must be greater than zero")
      return
    }

    setSaving(true)
    setSubmitError(null)
    try {
      const response = await authedFetch("/admin/subscriptions/plans", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: form.description.trim() || undefined,
          type: form.type,
          price,
          billingCycle: form.billingCycle,
          features: parseFeatureInput(form.features),
          isActive: form.isActive,
        }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      closeDialog(false)
      await loadData(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create plan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-background/50">
        <Header />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <HeadingLg className="mb-2 flex items-center gap-2">
                  <Crown className="h-8 w-8 text-primary" />
                  Subscription Plans
                </HeadingLg>
                <BodyMd className="text-muted-foreground">
                  Manage premium memberships for drivers, merchants, and VIP users.
                </BodyMd>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => void loadData(true)} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button className="gap-2 rounded-full bg-primary font-bold text-white hover:bg-primary/90" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Create Plan
                </Button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Crown className="h-4 w-4" />
                    Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : plans.length.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : activeSubscriptions.length.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Active Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : formatMoney(totalActiveRevenue)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-premium">
              <CardHeader>
                <CardTitle>Plan Catalog</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                    <LoaderCircle className="h-5 w-5 animate-spin" /> Loading subscription plans...
                  </div>
                ) : plans.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-lg font-bold">No subscription plans yet</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Create the first plan to start managing premium memberships.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-6 py-4">Plan Name</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Billing Cycle</th>
                          <th className="px-6 py-4">Active Subs</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Features</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => {
                          const features = planFeatures(plan.features)

                          return (
                            <tr key={plan.id} className="border-b transition hover:bg-muted/20">
                              <td className="px-6 py-4">
                                <div className="font-bold text-primary">{plan.name}</div>
                                {plan.description ? <div className="mt-1 text-xs text-muted-foreground">{plan.description}</div> : null}
                              </td>
                              <td className="px-6 py-4"><Badge variant="outline">{plan.type}</Badge></td>
                              <td className="px-6 py-4 font-black text-gold">{formatMoney(plan.price)}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">{formatCycle(plan.billingCycle)}</td>
                              <td className="px-6 py-4 font-mono">{(activeCountByPlan[plan.id] ?? 0).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <Badge variant={plan.isActive ? "default" : "secondary"} className="text-[10px]">
                                  {plan.isActive ? "ACTIVE" : "INACTIVE"}
                                </Badge>
                              </td>
                              <td className="max-w-xs px-6 py-4">
                                {features.length ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {features.slice(0, 3).map((feature) => (
                                      <Badge key={feature} variant="secondary" className="max-w-40 truncate">{feature}</Badge>
                                    ))}
                                    {features.length > 3 ? <Badge variant="outline">+{features.length - 3}</Badge> : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No feature list</span>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Active Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading active subscriptions...</p>
                ) : activeSubscriptions.length === 0 ? (
                  <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                    No active subscriptions have been assigned yet.
                  </p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {activeSubscriptions.slice(0, 8).map((subscription) => (
                      <div key={subscription.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{subscriberLabel(subscription)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{subscription.plan.name} · {formatCycle(subscription.plan.billingCycle)}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>{subscription.status}</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(subscription.startDate)} to {formatDate(subscription.endDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create subscription plan</DialogTitle>
            <DialogDescription>
              Define the audience, billing cycle, and benefits for a premium plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              <span className="mb-2 block">Plan name</span>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Driver Pro" disabled={saving} />
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-2 block">Price</span>
              <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="500" inputMode="decimal" disabled={saving} />
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-2 block">Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SubscriptionPlanType }))}
                disabled={saving}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="DRIVER">Driver</option>
                <option value="MERCHANT">Merchant</option>
                <option value="USER_VIP">VIP User</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-2 block">Billing cycle</span>
              <select
                value={form.billingCycle}
                onChange={(event) => setForm((current) => ({ ...current, billingCycle: event.target.value as SubscriptionBillingCycle }))}
                disabled={saving}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
            <label className="block text-sm font-medium md:col-span-2">
              <span className="mb-2 block">Description</span>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Priority tools and premium support" disabled={saving} />
            </label>
            <label className="block text-sm font-medium md:col-span-2">
              <span className="mb-2 block">Features</span>
              <textarea
                value={form.features}
                onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))}
                placeholder={"Priority dispatch\nLower commission\nMonthly analytics"}
                disabled={saving}
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                disabled={saving}
                className="h-4 w-4 rounded border-primary/30"
              />
              Active plan
            </label>
          </div>

          {submitError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {submitError}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => void createPlan()} disabled={saving}>
              {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
