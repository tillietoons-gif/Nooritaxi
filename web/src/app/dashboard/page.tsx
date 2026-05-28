"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Car, Package, DollarSign, ArrowUpRight, MapPin, Clock } from "lucide-react"
import { authedFetch, apiUrl, getStoredUser, type AuthUser } from "@/lib/auth"
import { useSocket } from "@/lib/use-socket"

type Ride = {
  id: string
  status: string
  pickupLocation: string
  dropoffLocation: string
  fare?: string | number
  requestedAt?: string
  createdAt?: string
}

type Order = {
  id: string
  status: string
  total?: string | number
  deliveryAddress: string
  placedAt?: string
  createdAt?: string
  restaurant?: { name?: string }
}

type Activity = {
  id: string
  type: "Ride" | "Order"
  title: string
  subtitle: string
  amount?: string | number
  status: string
  timestamp: string
}

export default function DashboardPage() {
  const [user] = useState<AuthUser | null>(() => getStoredUser())
  const [counts, setCounts] = useState({ rides: 0, deliveries: 0, restaurants: 0 })
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const [rides, setRides] = useState<Ride[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null)
  const [error, setError] = useState("")
  const { socket, connected } = useSocket(Boolean(user?.id))

  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    async function load() {
      setError("")
      const [ridesData, ordersData, deliveries, restaurants, wallet] = await Promise.all([
        authedFetch(`/rides?userId=${userId}&limit=5`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/orders?userId=${userId}&limit=5`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/deliveries?userId=${userId}`).then((res) => res.ok ? res.json() : []),
        fetch(`${apiUrl}/restaurants`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/wallet/${userId}?type=CUSTOMER&currency=AFN`).then((res) => res.ok ? res.json() : null),
      ])

      setRides(ridesData)
      setOrders(ordersData)
      setCounts({ rides: ridesData.length, deliveries: deliveries.length, restaurants: restaurants.length })
      setWalletBalance(wallet?.balance ? Number(wallet.balance).toLocaleString() : "0")
    }

    load().catch((err) => setError(err.message ?? "Unable to load dashboard data"))
  }, [user?.id])

  useEffect(() => {
    if (!socket || !rides.length) return

    const trackableRides = rides.filter((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status))
    trackableRides.forEach((ride) => socket.emit("joinTrip", ride.id))

    socket.on("locationUpdated", setDriverLocation)
    return () => {
      socket.off("locationUpdated", setDriverLocation)
    }
  }, [socket, rides])

  const activity = useMemo<Activity[]>(() => {
    const rideActivity = rides.map((ride) => ({
      id: ride.id,
      type: "Ride" as const,
      title: `${ride.pickupLocation} to ${ride.dropoffLocation}`,
      subtitle: "Transportation",
      amount: ride.fare,
      status: ride.status,
      timestamp: ride.requestedAt ?? ride.createdAt ?? "",
    }))
    const orderActivity = orders.map((order) => ({
      id: order.id,
      type: "Order" as const,
      title: order.restaurant?.name ?? "Restaurant order",
      subtitle: order.deliveryAddress,
      amount: order.total,
      status: order.status,
      timestamp: order.placedAt ?? order.createdAt ?? "",
    }))

    return [...rideActivity, ...orderActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }, [rides, orders])

  const stats = [
    { name: "Wallet", value: `AFN ${walletBalance}`, change: "Live", icon: <DollarSign className="h-5 w-5" /> },
    { name: "Trips", value: counts.rides.toString(), change: "Live", icon: <Car className="h-5 w-5" /> },
    { name: "Deliveries", value: counts.deliveries.toString(), change: "Live", icon: <Package className="h-5 w-5" /> },
    { name: "Restaurants", value: counts.restaurants.toString(), change: "Open", icon: <TrendingUp className="h-5 w-5" /> },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><HeadingMd className="text-2xl">Assalam-o-Alaikum, {user?.name ?? "Noori user"}!</HeadingMd><BodyMd className="text-muted-foreground text-sm">Your live super-app workspace is connected to the backend.</BodyMd></div>
        <div className="flex gap-3"><Button variant="outline">Export</Button><Button onClick={() => { window.location.href = "/book" }}>New Booking</Button></div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm"><CardContent className="p-6">
              <div className="flex items-center justify-between mb-4"><div className="bg-primary/10 p-2.5 rounded-lg text-primary">{stat.icon}</div><Badge variant="success" className="flex gap-1 h-6"><ArrowUpRight className="h-3 w-3" />{stat.change}</Badge></div>
              <div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{stat.name}</p><p className="text-2xl font-bold">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {activity.length ? (
              <div className="divide-y">
                {activity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.type}</Badge>
                        <p className="truncate text-sm font-medium">{item.title}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.amount ? `AFN ${Number(item.amount).toLocaleString()}` : "Pending"}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">No recent rides or orders yet.</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm flex flex-col"><CardHeader><CardTitle className="text-lg">Real-time Map</CardTitle></CardHeader><CardContent className="flex-1 p-6 flex flex-col">
             <div className="bg-secondary/40 rounded-xl flex-1 min-h-[220px] mb-6 flex flex-col items-center justify-center gap-3">
              <MapPin className={`h-10 w-10 text-primary ${driverLocation ? "" : "animate-bounce"}`} />
              {driverLocation ? (
                <div className="text-center">
                  <p className="text-sm font-semibold">Driver location live</p>
                  <p className="text-xs text-muted-foreground">{driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{connected ? "Waiting for driver coordinates" : "Socket disconnected"}</p>
              )}
             </div>
             <div className="space-y-4"><div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{connected ? "Tracking gateway connected" : "Tracking gateway offline"}</span></div><Button className="w-full mt-2 h-10">Expand View</Button></div>
        </CardContent></Card>
      </div>
    </div>
  )
}
