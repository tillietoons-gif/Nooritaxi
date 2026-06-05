"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Activity, Users, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function FraudDashboardPage() {
  const stats = [
    { label: "Active Alerts", value: "42", icon: AlertTriangle, color: "text-red-500", link: "/admin/fraud/alerts" },
    { label: "Open Cases", value: "15", icon: ShieldAlert, color: "text-orange-500", link: "/admin/fraud/cases" },
    { label: "High Risk Accounts", value: "24", icon: Users, color: "text-purple-500", link: "/admin/fraud/accounts" },
    { label: "Blacklist Entries", value: "892", icon: Activity, color: "text-primary", link: "/admin/fraud/blacklist" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Fraud & Risk Operations"
            subtitle="Real-time monitoring and investigation of suspicious activities across the platform."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Link href={stat.link} key={i}>
                <Card className="glass-premium hover:border-red-500/50 transition-colors cursor-pointer border-red-500/10 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <stat.icon className={`h-3 w-3 ${stat.color}`} /> {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black leading-none">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-premium border-primary/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                  <Activity className="h-5 w-5 text-primary" /> Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-primary/20 rounded-xl bg-primary/5">
                  <p className="text-sm text-muted-foreground font-mono">Risk Distribution Chart</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-premium border-destructive/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-destructive">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Recent Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center border-b border-destructive/10 pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">GPS Spoofing Detected</p>
                        <p className="text-xs text-muted-foreground mt-1">Driver jumped 5km in 10s · User ID: d-7281</p>
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-white bg-destructive px-2 py-1 rounded">CRITICAL</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
