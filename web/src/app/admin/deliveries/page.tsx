"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"

type Delivery = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  fee?: string | number | null
  createdAt: string
  driver?: { name?: string | null } | null
  sender?: { name?: string | null } | null
}

const DELIVERY_STATUSES = [
  "REQUESTED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
]

export default function AdminDeliveriesPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Delivery>
        title="Deliveries"
        endpoint="/admin/deliveries"
        statusOptions={DELIVERY_STATUSES}
        searchPlaceholder="Search by id or address…"
        rowKey={(r) => r.id}
        columns={[
          {
            key: "id",
            header: "Delivery",
            render: (r) => <span className="font-mono text-xs">{r.id.slice(-8)}</span>,
          },
          {
            key: "route",
            header: "Route",
            render: (r) => (
              <div className="max-w-xs">
                <p className="truncate">{r.pickupAddress}</p>
                <p className="truncate text-xs text-muted-foreground">→ {r.dropoffAddress}</p>
              </div>
            ),
          },
          { key: "sender", header: "Sender", render: (r) => r.sender?.name ?? "—" },
          { key: "driver", header: "Driver", render: (r) => r.driver?.name ?? "Unassigned" },
          {
            key: "fee",
            header: "Fee",
            render: (r) => (r.fee != null ? `${Number(r.fee).toLocaleString()} AFN` : "—"),
          },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "createdAt",
            header: "Created",
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
        ]}
      />
    </AuthGate>
  )
}
