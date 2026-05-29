"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { Bell, Car, Headphones, Package, ShieldCheck, Store, Users, Wallet } from "lucide-react"
import { AuthGate } from "@/components/auth-gate"
import { authedFetch } from "@/lib/auth"
import Link from "next/link"

export default function AdminPage() {
  const [overview, setOverview] = useState<Record<string, number> | null>(null)
  const [openTickets, setOpenTickets] = useState<Array<{ id: string; category?: string; priority?: string }>>([])
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      authedFetch("/admin/overview").then(async (response) => {
        if (!response.ok) throw new Error("Unable to load admin overview")
        return response.json()
      }),
      authedFetch("/support/tickets?status=OPEN").then((response) => response.ok ? response.json() : []),
    ])
      .then(([overviewData, tickets]) => {
        setOverview(overviewData)
        setOpenTickets(tickets)
      })
      .catch((err) => setError(err.message))
  }, [])

  const metrics = [
    { label: "Users", value: overview?.users ?? 0, icon: Users },
    { label: "Drivers", value: overview?.drivers ?? 0, icon: Car },
    { label: "Orders", value: overview?.orders ?? 0, icon: Store },
    { label: "Deliveries", value: overview?.deliveries ?? 0, icon: Wallet },
  ]
  const supportCount = (category: string) => openTickets.filter((ticket) => ticket.category?.toLowerCase().includes(category)).length
  const highPriorityCount = openTickets.filter((ticket) => ["HIGH", "URGENT"].includes(ticket.priority ?? "")).length
  const queues = [
    { label: "Ride safety checks", value: supportCount("ride"), tone: highPriorityCount > 0 ? "High" : "Normal" },
    { label: "Delivery disputes", value: supportCount("delivery"), tone: "Normal" },
    { label: "Driver verifications", value: supportCount("driver"), tone: "Normal" },
    { label: "Support chats waiting", value: openTickets.length, tone: highPriorityCount > 0 ? "High" : "Normal" },
  ]
  const marketplace = [
    { label: "Rides", value: overview?.rides ?? 0, icon: Car },
    { label: "Food orders", value: overview?.orders ?? 0, icon: Store },
    { label: "Parcel delivery", value: overview?.deliveries ?? 0, icon: Package },
  ]

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <HeadingMd className="text-2xl">Noori Operations</HeadingMd>
            <BodyMd className="text-muted-foreground">Admin control center for mobility, food, delivery, wallet, safety, and support.</BodyMd>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Bell className="mr-2 h-4 w-4" />Broadcast</Button>
            <Link href="/admin/kyc">
              <Button><ShieldCheck className="mr-2 h-4 w-4" />Safety Review</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value.toLocaleString()}</p>
                </div>
                <metric.icon className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Live Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {marketplace.map((item) => (
                <div key={item.label} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-4 text-3xl font-bold">{item.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">active right now</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Queues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queues.map((queue) => (
                <div key={queue.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{queue.label}</p>
                    <p className="text-sm text-muted-foreground">{queue.value} items</p>
                  </div>
                  <Badge variant={queue.tone === "High" ? "destructive" : "secondary"}>{queue.tone}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5" />Customer Support Chat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Dari queue", "Pashto queue", "Merchant queue"].map((queue) => (
              <Link key={queue} href="/admin/support" className="flex-1">
                <Button variant="outline" className="h-16 w-full justify-between">
                  {queue}
                  <Badge>Open</Badge>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
    </AuthGate>
  )
}
