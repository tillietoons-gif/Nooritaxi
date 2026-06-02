"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Car, Users, Map, BellRing, PhoneCall, ShieldAlert, Crosshair, Network, Megaphone } from "lucide-react"
import Link from "next/link"

export default function OCCDashboardPage() {
  const metrics = [
    { label: "Active Drivers", value: "3,402", color: "text-primary", icon: Car },
    { label: "Active Trips", value: "1,204", color: "text-blue-500", icon: Map },
    { label: "Pending Requests", value: "45", color: "text-orange-500", icon: Activity },
    { label: "SOS Alerts", value: "2", color: "text-red-500", icon: BellRing },
    { label: "Open Incidents", value: "18", color: "text-purple-500", icon: ShieldAlert },
    { label: "Completion Rate", value: "94.5%", color: "text-green-500", icon: Network },
  ]

  const occModules = [
    { label: "Live Map Center", icon: Crosshair, href: "/admin/operations/map", desc: "Real-time fleet tracking & zones" },
    { label: "Manual Dispatch", icon: Users, href: "/admin/operations/dispatch", desc: "VIP queues & manual assignment" },
    { label: "SOS Emergency", icon: PhoneCall, href: "/admin/operations/sos", desc: "Active safety incidents" },
    { label: "Comms Broadcast", icon: Megaphone, href: "/admin/operations/broadcast", desc: "Mass notifications & alerts" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Network className="h-8 w-8 text-primary" />
                Operations Command Center (OCC)
              </HeadingLg>
              <p className="text-muted-foreground">Mission control for real-time dispatch, emergencies, and fleet management.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-xs font-bold animate-pulse">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> LIVE SYSTEM HEALTH: NORMAL
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {metrics.map((m, i) => (
              <Card key={i} className="glass-premium">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <m.icon className={`h-6 w-6 mb-2 ${m.color}`} />
                  <div className="text-2xl font-black">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{m.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {occModules.map((mod, i) => (
              <Link href={mod.href} key={i}>
                <Card className="glass-premium hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        <mod.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold">{mod.label}</div>
                        <div className="text-sm text-muted-foreground font-normal">{mod.desc}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
