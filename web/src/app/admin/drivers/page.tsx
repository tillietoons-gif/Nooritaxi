"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"

type Driver = {
  id: string
  status: string
  tier?: string
  ratingAverage?: number | null
  completedTrips?: number
  user?: { name?: string | null; phone?: string | null } | null
  vehicles?: { plateNumber?: string }[]
}

const DRIVER_STATUSES = ["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"]

export default function AdminDriversPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Driver>
        title="Drivers"
        endpoint="/admin/drivers"
        statusOptions={DRIVER_STATUSES}
        searchPlaceholder="Search by name, phone, license…"
        rowHref={(r) => `/admin/drivers/${r.id}`}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Name", render: (r) => r.user?.name ?? "—" },
          { key: "phone", header: "Phone", render: (r) => r.user?.phone ?? "—" },
          {
            key: "vehicle",
            header: "Vehicle",
            render: (r) => r.vehicles?.map((v) => v.plateNumber).filter(Boolean).join(", ") || "—",
          },
          { key: "tier", header: "Tier", render: (r) => r.tier ?? "—" },
          {
            key: "rating",
            header: "Rating",
            render: (r) => (r.ratingAverage != null ? `★ ${r.ratingAverage.toFixed(1)}` : "—"),
          },
          { key: "trips", header: "Trips", render: (r) => r.completedTrips ?? 0 },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </AuthGate>
  )
}
