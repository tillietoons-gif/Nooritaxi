"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { } from "@/components/ui/card"
import { HeadingMd, BodyMd, HeadingSm, LabelMd } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
import {

  Car,
  Package,
  DollarSign,

  MapPin,

  Activity,
  Box,
  LayoutGrid
} from "lucide-react"
import { authedFetch, apiUrl, getStoredUser, type AuthUser } from "@/lib/auth"
import { useSocket } from "@/lib/use-socket"
import { useUserBehavior } from "@/components/user-behavior-provider"

type ActivityItem = {
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
  const { behavior, trackFeatureUsage } = useUserBehavior()

  const [counts, setCounts] = useState({ rides: 0, deliveries: 0, restaurants: 0 })
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const [rides, setRides] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [error, setError] = useState("")
  const { socket, connected } = useSocket(Boolean(user?.id))

  // Initial order for widgets
  const defaultWidgets = ["stats", "activity", "map"]
  const [widgetOrder, setWidgetOrder] = useState(defaultWidgets)

  useEffect(() => {
    // Reorder based on usage frequency from behavior provider
    const sorted = [...defaultWidgets].sort((a, b) => {
      const usageA = behavior.featureUsage?.[a] || 0
      const usageB = behavior.featureUsage?.[b] || 0
      return usageB - usageA
    })
    setWidgetOrder(sorted)
  }, [behavior.featureUsage])

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const [ridesData, ordersData, deliveries, restaurants, wallet] = await Promise.all([
        authedFetch(`/trips?userId=${user?.id}&limit=5`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/food/orders?userId=${user?.id}&limit=5`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/logistics/deliveries?userId=${user?.id}`).then((res) => res.ok ? res.json() : []),
        fetch(`${apiUrl}/food/restaurants`).then((res) => res.ok ? res.json() : []),
        authedFetch(`/wallet/${user?.id}?type=CUSTOMER&currency=AFN`).then((res) => res.ok ? res.json() : null),
      ])
      setRides(ridesData)
      setOrders(ordersData)
      setCounts({ rides: ridesData.length, deliveries: deliveries.length, restaurants: restaurants.length })
      setWalletBalance(wallet?.balance ? Number(wallet.balance).toLocaleString() : "0")
    }
    load().catch((err) => setError(err.message))
  }, [user?.id])

  const activity = useMemo<ActivityItem[]>(() => {
    const rideActivity = rides.map((r) => ({
      id: r.id, type: "Ride" as const, title: `${r.pickupLocation} to ${r.dropoffLocation}`,
      subtitle: "Transportation", amount: r.fare, status: r.status, timestamp: r.requestedAt || r.createdAt || ""
    }))
    const orderActivity = orders.map((o) => ({
      id: o.id, type: "Order" as const, title: o.restaurant?.name || "Restaurant order",
      subtitle: o.deliveryAddress, amount: o.total, status: o.status, timestamp: o.placedAt || o.createdAt || ""
    }))
    return [...rideActivity, ...orderActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }, [rides, orders])

  const stats = [
    { id: "wallet", name: "Wallet", value: `AFN ${walletBalance}`, icon: <DollarSign className="h-5 w-5" /> },
    { id: "rides", name: "Trips", value: counts.rides.toString(), icon: <Car className="h-5 w-5" /> },
    { id: "deliveries", name: "Deliveries", value: counts.deliveries.toString(), icon: <Package className="h-5 w-5" /> },
    { id: "analytics", name: "Efficiency", value: "98%", icon: <Activity className="h-5 w-5" /> },
  ]

  const renderWidget = (id: string) => {
    switch (id) {
      case "stats":
        return (
          <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" onMouseEnter={() => trackFeatureUsage("stats")}>
            {stats.map((stat) => (
              <GlassSurface key={stat.id} className="p-6 bento-shadow border-none hover:translate-y-[-4px] transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">{stat.icon}</div>
                  <Badge className="bg-primary/5 text-primary border-none">Live</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              </GlassSurface>
            ))}
          </div>
        )
      case "activity":
        return (
          <GlassSurface key="activity" className="p-0 border-none bento-shadow overflow-hidden" onMouseEnter={() => trackFeatureUsage("activity")}>
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <HeadingSm className="text-lg">Recent Logistics</HeadingSm>
              <Button variant="ghost" size="sm" className="rounded-full">View All</Button>
            </div>
            <div className="divide-y divide-border/30">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group">
                  <div className="flex gap-4 items-center">
                    <div className="h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {item.type === "Ride" ? <Car className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{item.amount ? `AFN ${Number(item.amount).toLocaleString()}` : "---"}</p>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{item.status}</Badge>
                  </div>
                </div>
              ))}
              {!activity.length && <div className="p-12 text-center text-muted-foreground italic">No recent flow detected.</div>}
            </div>
          </GlassSurface>
        )
      case "map":
        return (
          <GlassSurface key="map" className="p-6 border-none bento-shadow flex flex-col min-h-[400px]" onMouseEnter={() => trackFeatureUsage("map")}>
             <div className="flex justify-between items-center mb-6">
                <HeadingSm className="text-lg">Real-time Visualization</HeadingSm>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-primary">Live Network</span>
                </div>
             </div>
             <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center">
                <MapPin className="h-12 w-12 text-primary animate-bounce mb-4" />
                <BodyMd className="text-sm font-bold">Network Grid Active</BodyMd>
                <p className="text-xs text-muted-foreground">Monitoring 14 nodes in Kabul cluster</p>
             </div>
             <div className="mt-6 flex gap-4">
                <Button className="flex-1 rounded-full h-12 font-bold bg-primary">Expand Map</Button>
                <Button variant="outline" className="flex-1 rounded-full h-12 font-bold glass">Optimize Routes</Button>
             </div>
          </GlassSurface>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <LabelMd>Intelligent Command Center</LabelMd>
          </div>
          <HeadingMd className="text-4xl md:text-5xl font-black">
            Assalam, {user?.name?.split(" ")[0] || "User"}
          </HeadingMd>
          <BodyMd className="text-lg">Your adaptive workspace is optimized for peak performance.</BodyMd>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full h-12 px-6 font-bold glass">System Health</Button>
          <Button className="rounded-full h-12 px-6 font-bold bg-primary shadow-xl shadow-primary/20" onClick={() => window.location.href = "/book"}>New Operation</Button>
        </div>
      </header>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {widgetOrder.map((id) => (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {id === "stats" ? renderWidget("stats") : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    {id === "activity" ? renderWidget("activity") : id === "map" ? renderWidget("map") : null}
                  </div>
                  <div className="hidden lg:block">
                     {/* Dynamic Secondary Content */}
                     {id === "activity" ? renderWidget("map") : renderWidget("activity")}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
