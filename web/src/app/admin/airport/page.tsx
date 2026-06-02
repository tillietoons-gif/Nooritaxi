"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlaneTakeoff, Users, ListOrdered, Clock, PlaneLanding, Settings2 } from "lucide-react"
import Link from "next/link"

export default function AirportDashboardPage() {
  const airportStats = [
    { label: "Drivers in Queue", value: "124", icon: ListOrdered, color: "text-blue-500", link: "/admin/airport/queue" },
    { label: "Active Pickups", value: "32", icon: Users, color: "text-green-500", link: "/admin/airport/map" },
    { label: "Upcoming Flights (2h)", value: "18", icon: PlaneLanding, color: "text-orange-500", link: "/admin/airport/flights" },
    { label: "Avg Wait Time", value: "14m", icon: Clock, color: "text-primary", link: "#" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <PlaneTakeoff className="h-8 w-8 text-primary" />
                Airport Operations Hub
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage automated driver staging, FIFO queues, and VIP flight pickups.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <select className="bg-background border border-primary/20 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-primary/50">
                <option>Kabul International (KBL)</option>
                <option>Herat International (HEA)</option>
                <option>Mazar-e-Sharif (MZR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {airportStats.map((stat, i) => (
              <Link href={stat.link} key={i}>
                <Card className="glass-premium hover:border-primary/50 transition-colors cursor-pointer border-primary/10 group h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-premium">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-primary" /> Live Queue Status (Terminal 1)
                </CardTitle>
                <Settings2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-muted-foreground/30 w-8">#{i}</div>
                        <div>
                          <p className="font-bold text-sm">Driver {900 + i}</p>
                          <p className="text-xs text-muted-foreground">Economy • Toyota Corolla</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">Wait: {14 + i}m</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlaneLanding className="h-5 w-5 text-orange-500" /> Incoming Flights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { fn: "FG302", airline: "Ariana Afghan", time: "14:30", status: "LANDED" },
                    { fn: "RQ901", airline: "Kam Air", time: "15:15", status: "ON_TIME" },
                    { fn: "EK640", airline: "Emirates", time: "16:45", status: "DELAYED" },
                  ].map((f, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-bold text-sm">{f.fn} - {f.airline}</p>
                        <p className="text-xs text-muted-foreground">Est. 120 passengers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{f.time}</p>
                        <span className={`text-[10px] font-bold ${f.status === 'DELAYED' ? 'text-red-500' : 'text-green-500'}`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
