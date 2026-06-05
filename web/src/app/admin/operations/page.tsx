"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Car, Users, Map, BellRing, ShieldAlert, Crosshair, Network, Megaphone } from "lucide-react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function OCCDashboardPage() {
  const metrics = [
    { label: "Active Drivers", value: "3,402", color: "text-primary", icon: Car },
    { label: "Active Trips", value: "1,204", color: "text-blue-500", icon: Map },
    { label: "Pending Requests", value: "45", color: "text-orange-500", icon: Activity },
    { label: "SOS Alerts", value: "2", color: "text-red-500", icon: BellRing },
    { label: "Open Incidents", value: "18", color: "text-purple-500", icon: ShieldAlert },
    { label: "System Health", value: "94.5%", color: "text-green-500", icon: Network },
  ]

  const occModules = [
    { label: "Live Map Center", icon: Crosshair, href: "/admin/operations/map", desc: "Real-time fleet tracking & zones" },
    { label: "Manual Dispatch", icon: Users, href: "/admin/operations/dispatch", desc: "VIP queues & manual assignment" },
    { label: "SOS Emergency", icon: BellRing, href: "/admin/operations/sos", desc: "Active safety incidents" },
    { label: "Comms Broadcast", icon: Megaphone, href: "/admin/operations/broadcast", desc: "Mass notifications & alerts" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Operations Command Center"
            subtitle="Mission control for real-time dispatch, emergencies, and fleet logistics."
            actions={
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> System Normal
              </div>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {metrics.map((m, i) => (
              <Card key={i} className="border-primary/10 glass-premium shadow-xl">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <m.icon className={`h-5 w-5 mb-2 ${m.color} opacity-70`} />
                  <div className="text-xl font-black leading-none">{m.value}</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-2">{m.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {occModules.map((mod, i) => (
              <Link href={mod.href} key={i}>
                <Card className="border-primary/10 shadow-2xl glass-premium hover:border-primary/30 transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <mod.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-black text-lg tracking-tight uppercase">{mod.label}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 opacity-70">{mod.desc}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
