"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { BarChart3 } from "lucide-react"

export default function FleetAnalyticsPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Fleet Analytics
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Performance metrics, revenue charts, and utilization rates across all fleets.
            </BodyMd>
          </div>

          <div className="h-96 glass-premium flex items-center justify-center border border-primary/10 rounded-2xl">
            <p className="text-muted-foreground font-mono">Chart components loading...</p>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
