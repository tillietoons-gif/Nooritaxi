"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"

type Trip = {
  id: string
  status: string
  pickupLocation: string
  dropoffLocation: string
  fare?: string | number | null
  createdAt: string
  customer?: { name?: string | null; phone?: string | null } | null
  driver?: { name?: string | null; phone?: string | null } | null
  vehicle?: { plateNumber?: string | null } | null
}

const TRIP_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "DRIVER_ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

export default function AdminTripsPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Trip>
        title="Trips"
        endpoint="/admin/trips"
        statusOptions={TRIP_STATUSES}
        searchPlaceholder="Search by id, address, customer, driver…"
        rowKey={(r) => r.id}
        columns={[
          {
            key: "id",
            header: "Trip",
            render: (r) => <span className="font-mono text-xs">{r.id.slice(-8)}</span>,
          },
          {
            key: "route",
            header: "Route",
            render: (r) => (
              <div className="max-w-xs">
                <p className="truncate">{r.pickupLocation}</p>
                <p className="truncate text-xs text-muted-foreground">→ {r.dropoffLocation}</p>
              </div>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (r) => r.customer?.name ?? r.customer?.phone ?? "—",
          },
          {
            key: "driver",
            header: "Driver",
            render: (r) =>
              r.driver?.name ?? r.driver?.phone
                ? `${r.driver?.name ?? r.driver?.phone}${r.vehicle?.plateNumber ? ` · ${r.vehicle.plateNumber}` : ""}`
                : "Unassigned",
          },
          {
            key: "fare",
            header: "Fare",
            render: (r) => (r.fare != null ? `${Number(r.fare).toLocaleString()} AFN` : "—"),
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
