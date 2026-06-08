"use client"

import { AuthGate } from "@/components/auth-gate"
import { BarChart3 } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function FleetAnalyticsPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Fleet Analytics"
            subtitle="Performance metrics, revenue charts, and utilization rates across all fleets."
          />

          <div className="h-96 glass-premium flex items-center justify-center border border-primary/10 rounded-2xl relative z-10 shadow-xl backdrop-blur-md bg-white/5">
            <BarChart3 className="h-12 w-12 text-primary/50 absolute" />
            <p className="text-muted-foreground font-mono relative z-20">Chart components loading...</p>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
