"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Utensils, Navigation } from "lucide-react"

export default function DeliveriesDashboardPage() {
  const deliveries = [
    { id: "DEL-701", type: "FOOD", origin: "Kabul Kabab House", destination: "Wazir Akbar Khan", driver: "Ali (Motorbike)", status: "IN_TRANSIT" },
    { id: "DEL-702", type: "PARCEL", origin: "Shahr-e-Naw", destination: "Karte 4", driver: "Zahra (Van)", status: "PICKED_UP" },
    { id: "DEL-703", type: "FOOD", origin: "Herat Fast Food", destination: "Herat University", driver: "Unassigned", status: "PENDING" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Delivery Management
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Monitor and route Food and Parcel deliveries across the network.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10">
                <Utensils className="h-4 w-4 mr-1" /> Food Orders
              </Button>
              <Button variant="outline" className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10">
                <Package className="h-4 w-4 mr-1" /> Parcels
              </Button>
            </div>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Delivery ID</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Pickup</th>
                    <th className="px-6 py-4">Dropoff</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono font-black text-primary">{d.id}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={d.type === 'FOOD' ? 'border-orange-500 text-orange-500' : 'border-blue-500 text-blue-500'}>
                          {d.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold">{d.origin}</td>
                      <td className="px-6 py-4 font-bold">{d.destination}</td>
                      <td className="px-6 py-4 text-muted-foreground">{d.driver}</td>
                      <td className="px-6 py-4">
                        <Badge variant={d.status === 'PENDING' ? 'secondary' : 'default'} className="text-[10px]">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8 border-primary/50 text-primary">
                          <Navigation className="h-4 w-4 mr-1" /> Track
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
