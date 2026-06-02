"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, TrendingUp, HandCoins, Undo2 } from "lucide-react"

export default function FinanceDashboardPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <Banknote className="h-8 w-8 text-primary" />
              Cash Finance Center
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Monitor platform revenue, cash receivables, and outstanding settlements.
            </BodyMd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <HandCoins className="h-4 w-4" /> Outstanding Receivables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-500">124,500 AFN</div>
                <p className="text-xs text-muted-foreground mt-1">Cash owed by drivers</p>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Total Cash Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">850,200 AFN</div>
                <p className="text-xs text-muted-foreground mt-1">Cleared this month</p>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Platform Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gold">154,000 AFN</div>
                <p className="text-xs text-muted-foreground mt-1">Net commissions earned</p>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Undo2 className="h-4 w-4" /> Pending Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">12</div>
                <p className="text-xs text-muted-foreground mt-1">Requires approval</p>
              </CardContent>
            </Card>
          </div>

          <div className="h-96 glass-premium flex items-center justify-center border border-primary/10 rounded-2xl">
            <p className="text-muted-foreground font-mono">Revenue Trends Chart loading...</p>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
