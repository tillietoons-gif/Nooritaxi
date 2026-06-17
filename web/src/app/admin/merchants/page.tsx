"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Store } from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authedFetch } from "@/lib/auth"

type MerchantDocument = {
  id: string
  type: "BUSINESS_LICENSE" | "OWNER_ID" | "PAYOUT_CONTACT"
  url: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  createdAt: string
}

type MerchantRestaurant = {
  id: string
  name: string
  address: string
  phone?: string | null
  status: "PENDING" | "OPEN" | "CLOSED" | "SUSPENDED"
  cuisineTypes: string[]
  owner: { id: string; name?: string | null; phone?: string | null; status: string; isVerified: boolean }
  documents: MerchantDocument[]
  _count: { menuItems: number; orders: number }
}

async function responseMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => null)
  const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
  return message ? `${fallback}: ${message}` : `${fallback} (${res.status})`
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authedFetch("/admin/merchants?limit=100")
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to load merchants"))
      const data = await res.json()
      setMerchants(data.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load merchants")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function updateRestaurantStatus(id: string, status: MerchantRestaurant["status"]) {
    setActionLoading(`restaurant:${id}:${status}`)
    setError("")
    try {
      const res = await authedFetch(`/admin/merchants/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to update merchant"))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update merchant")
    } finally {
      setActionLoading("")
    }
  }

  async function updateDocumentStatus(restaurantId: string, docId: string, status: MerchantDocument["status"]) {
    setActionLoading(`document:${docId}:${status}`)
    setError("")
    try {
      const res = await authedFetch(`/admin/merchants/${restaurantId}/documents/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to update document"))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document")
    } finally {
      setActionLoading("")
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Merchant Verification"
            subtitle="Review business documents, approve restaurant profiles, and suspend merchant access."
            actions={
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="px-6 py-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">
              Loading merchant profiles...
            </div>
          ) : merchants.length === 0 ? (
            <Card className="border-primary/10 glass-premium">
              <CardContent className="p-12 text-center text-muted-foreground">No merchant profiles found.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5">
              {merchants.map((merchant) => (
                <Card key={merchant.id} className="border-primary/10 glass-premium">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Store className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-black">{merchant.name}</h3>
                          <Badge variant={merchant.status === "OPEN" ? "default" : merchant.status === "SUSPENDED" ? "destructive" : "secondary"}>
                            {merchant.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{merchant.address}</p>
                        <p className="mt-2 text-xs font-bold text-muted-foreground">
                          Owner: {merchant.owner.name ?? merchant.owner.phone ?? merchant.owner.id} · {merchant._count.menuItems} menu items · {merchant._count.orders} orders
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => updateRestaurantStatus(merchant.id, "OPEN")} disabled={Boolean(actionLoading)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateRestaurantStatus(merchant.id, "CLOSED")} disabled={Boolean(actionLoading)}>
                          Close
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateRestaurantStatus(merchant.id, "SUSPENDED")} disabled={Boolean(actionLoading)}>
                          Suspend
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 divide-y divide-primary/5 rounded-lg border border-primary/10">
                      {merchant.documents.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No merchant documents submitted yet.</p>
                      ) : (
                        merchant.documents.map((doc) => (
                          <div key={doc.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black uppercase tracking-widest">{doc.type.replaceAll("_", " ")}</p>
                                <Badge variant={doc.status === "VERIFIED" ? "default" : doc.status === "REJECTED" ? "destructive" : "secondary"}>
                                  {doc.status}
                                </Badge>
                              </div>
                              <a className="mt-1 block text-xs font-bold text-primary underline-offset-4 hover:underline" href={doc.url} target="_blank" rel="noreferrer">
                                {doc.url}
                              </a>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateDocumentStatus(merchant.id, doc.id, "VERIFIED")} disabled={Boolean(actionLoading)}>
                                Verify
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateDocumentStatus(merchant.id, doc.id, "REJECTED")} disabled={Boolean(actionLoading)}>
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGate>
  )
}
