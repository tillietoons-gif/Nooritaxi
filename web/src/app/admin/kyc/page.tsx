"use client"

import { AuthGate } from "@/components/auth-gate"
import { KycDataTable } from "@/components/admin/KycDataTable"

export default function KycReviewPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen bg-muted/20 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Driver KYC Review</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and approve or reject pending driver documents.
            </p>
          </div>

          <KycDataTable />
        </div>
      </main>
    </AuthGate>
  )
}
