"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Activity, Users, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function FraudDashboardPage() {
  const stats = [
    { label: "Active Alerts", value: "42", icon: AlertTriangle, color: "text-red-500", link: "/admin/fraud/alerts" },
    { label: "Open Cases", value: "15", icon: ShieldAlert, color: "text-orange-500", link: "/admin/fraud/cases" },
    { label: "High Risk Accounts", value: "24", icon: Users, color: "text-purple-500", link: "/admin/fraud/accounts" },
    { label: "Blacklist Entries", value: "892", icon: Activity, color: "text-primary", link: "/admin/fraud/blacklist" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              Fraud & Risk Operations Center
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Real-time monitoring and investigation of suspicious activities across the platform.
            </BodyMd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <Link href={stat.link} key={i}>
                <Card className="glass-premium hover:border-red-500/50 transition-colors cursor-pointer border-red-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} /> {stat.label}
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground font-mono">Risk Distribution Chart</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Recent Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-bold text-sm">GPS Spoofing Detected</p>
                        <p className="text-xs text-muted-foreground">Driver jumped 5km in 10s</p>
                      </div>
                      <span className="text-xs font-mono text-red-500 bg-red-500/10 px-2 py-1 rounded">CRITICAL</span>
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
