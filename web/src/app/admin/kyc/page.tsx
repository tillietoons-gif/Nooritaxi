"use client"

import { AuthGate } from "@/components/auth-gate"
import { KycDataTable } from "@/components/admin/KycDataTable"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function KycReviewPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Driver KYC Review"
            subtitle="Review and approve or reject pending driver documents."
          />

          <KycDataTable />
        </div>
      </main>
    </AuthGate>
  )
}
