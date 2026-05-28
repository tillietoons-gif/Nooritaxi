"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Car, Package, DollarSign, ArrowUpRight, MapPin, Clock } from "lucide-react"
import { authedFetch, getStoredUser } from "@/lib/auth"

export default function DashboardPage() {
  const [counts, setCounts] = useState({ rides: 0, deliveries: 0, restaurants: 0 })
  const user = getStoredUser()

  useEffect(() => {
    async function load() {
      const [rides, deliveries, restaurants] = await Promise.all([
        authedFetch(`/rides${user?.id ? `?userId=${user.id}` : ""}`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/deliveries${user?.id ? `?userId=${user.id}` : ""}`).then((res) => res.ok ? res.json() : []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"}/restaurants`).then((res) => res.ok ? res.json() : []),
      ])
      setCounts({ rides: rides.length, deliveries: deliveries.length, restaurants: restaurants.length })
    }
    load()
  }, [user?.id])

  const stats = [
    { name: "Wallet", value: "AFN", change: "Ready", icon: <DollarSign className="h-5 w-5" /> },
    { name: "Trips", value: counts.rides.toString(), change: "Live", icon: <Car className="h-5 w-5" /> },
    { name: "Deliveries", value: counts.deliveries.toString(), change: "Live", icon: <Package className="h-5 w-5" /> },
    { name: "Restaurants", value: counts.restaurants.toString(), change: "Open", icon: <TrendingUp className="h-5 w-5" /> },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><HeadingMd className="text-2xl">Assalam-o-Alaikum, {user?.name ?? "Noori user"}!</HeadingMd><BodyMd className="text-muted-foreground text-sm">Your live super-app workspace is connected to the backend.</BodyMd></div>
        <div className="flex gap-3"><Button variant="outline">Export</Button><Button>New Booking</Button></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm"><CardContent className="p-6">
              <div className="flex items-center justify-between mb-4"><div className="bg-primary/10 p-2.5 rounded-lg text-primary">{stat.icon}</div><Badge variant="success" className="flex gap-1 h-6"><ArrowUpRight className="h-3 w-3" />{stat.change}</Badge></div>
              <div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{stat.name}</p><p className="text-2xl font-bold">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm"><CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader><CardContent className="p-0"><div className="p-6 text-center text-muted-foreground">Activity from rides, orders, and deliveries will appear here.</div></CardContent></Card>
        <Card className="border-none shadow-sm flex flex-col"><CardHeader><CardTitle className="text-lg">Real-time Map</CardTitle></CardHeader><CardContent className="flex-1 p-6 flex flex-col">
             <div className="bg-secondary/40 rounded-xl flex-1 mb-6 flex items-center justify-center"><MapPin className="h-10 w-10 text-primary animate-bounce" /></div>
             <div className="space-y-4"><div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Driver and delivery tracking ready</span></div><Button className="w-full mt-2 h-10">Expand View</Button></div>
        </CardContent></Card>
      </div>
    </div>
  )
}
