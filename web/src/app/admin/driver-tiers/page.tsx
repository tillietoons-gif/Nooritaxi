"use client"

import { useState, useEffect } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd, HeadingSm } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Car, Star, CheckCircle, AlertTriangle } from "lucide-react"

export default function DriverTiersPage() {
  const [metrics, setMetrics] = useState({
    avgRating: 4.82,
    avgAcceptance: 92,
  })

  // Simulate real-time metric fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        avgRating: Math.max(4.5, Math.min(5.0, prev.avgRating + (Math.random() - 0.5) * 0.05)),
        avgAcceptance: Math.max(80, Math.min(100, prev.avgAcceptance + (Math.random() - 0.5) * 2)),
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Driver Tiers & Performance
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Monitor network health, acceptance rates, and driver distributions across tiers.
            </BodyMd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" /> Network Avg Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{metrics.avgRating.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Avg Acceptance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{metrics.avgAcceptance.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" /> Total Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">1,204</div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> At Risk (Sub 4.5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-500">42</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 mb-8">
            <CardHeader>
              <HeadingSm>Tier Distribution & Requirements</HeadingSm>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { name: "Standard", drivers: 450, rating: "4.5+", acc: "80%+", color: "bg-slate-100 dark:bg-slate-800" },
                  { name: "Pro", drivers: 320, rating: "4.7+", acc: "85%+", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-500/30" },
                  { name: "Expert", drivers: 280, rating: "4.85+", acc: "90%+", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-500/30" },
                  { name: "Elite", drivers: 154, rating: "4.95+", acc: "95%+", color: "bg-gold/10 border-gold/30" }
                ].map(tier => (
                  <div key={tier.name} className={`p-6 rounded-2xl border ${tier.color} flex flex-col items-center justify-center text-center`}>
                    <h3 className="font-black text-xl mb-1">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{tier.drivers} Drivers</p>
                    <div className="w-full space-y-2 text-sm">
                      <div className="flex justify-between bg-background/50 px-3 py-1.5 rounded-md">
                        <span>Rating Req</span>
                        <span className="font-bold">{tier.rating}</span>
                      </div>
                      <div className="flex justify-between bg-background/50 px-3 py-1.5 rounded-md">
                        <span>Acceptance Req</span>
                        <span className="font-bold">{tier.acc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}