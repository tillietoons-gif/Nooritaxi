"use client"

import { useState, useEffect } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd, HeadingSm } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp, Users, Gift, Activity } from "lucide-react"

type Redemption = {
  id: string
  user: string
  reward: string
  points: number
  status: "completed" | "pending"
  time: string
}

export default function LoyaltyAdminPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([
    { id: "R-1001", user: "Ahmad S.", reward: "Free Ride (Up to 500 AFN)", points: 1500, status: "completed", time: "2 min ago" },
    { id: "R-1002", user: "Zahra M.", reward: "10% Off Next 5 Rides", points: 800, status: "pending", time: "5 min ago" },
    { id: "R-1003", user: "Karim R.", reward: "Priority Support Month", points: 2000, status: "completed", time: "12 min ago" },
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setRedemptions(prev => [
          {
            id: `R-${1000 + Math.floor(Math.random() * 9000)}`,
            user: "New User",
            reward: "Free Ride (Up to 500 AFN)",
            points: 1500,
            status: "pending",
            time: "Just now"
          },
          ...prev.slice(0, 4)
        ])
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGate requiredRole="ADMIN">
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Award className="h-8 w-8 text-gold" />
                Loyalty Program
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Real-time overview of points, tiers, and user redemptions.
              </BodyMd>
            </div>
            <Badge className="bg-primary/10 text-primary animate-pulse border-primary/20">
              <Activity className="h-3 w-3 mr-1" /> Live Sync Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Total Enrolled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">24,592</div>
                <p className="text-xs text-primary flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" /> +12% this month
                </p>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" /> Points Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">1.2M</div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Gift className="h-4 w-4" /> Rewards Claimed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">8,439</div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-gold/20 bg-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold flex items-center gap-2">
                  <Award className="h-4 w-4" /> Platinum Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gold">842</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <HeadingSm>Recent Redemptions</HeadingSm>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {redemptions.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{r.reward}</span>
                          <span className="text-xs text-muted-foreground">{r.user} • {r.id}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-gold">-{r.points} pts</span>
                          <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                            {r.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-16 text-right">{r.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/10 bg-primary/5">
                <CardHeader>
                  <HeadingSm>Tier Configuration</HeadingSm>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Bronze", pts: "0 - 999", color: "text-orange-700" },
                    { name: "Silver", pts: "1,000 - 4,999", color: "text-slate-400" },
                    { name: "Gold", pts: "5,000 - 9,999", color: "text-yellow-500" },
                    { name: "Platinum", pts: "10,000+", color: "text-cyan-400" }
                  ].map(tier => (
                    <div key={tier.name} className="flex justify-between items-center border-b border-primary/10 pb-2 last:border-0">
                      <span className={`font-bold ${tier.color}`}>{tier.name}</span>
                      <span className="text-sm text-muted-foreground">{tier.pts} pts</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}