"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Ban } from "lucide-react"

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
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  async function cancelTrip(id: string) {
    if (!confirm(t('admin.confirmCancelTrip', `Cancel trip {{id}}?`, { id }))) return
    try {
      const res = await authedFetch(`/admin/trips/${id}/status`, { 
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }) 
      })
      if (!res.ok) throw new Error(t('admin.failedCancelTrip', "Failed to cancel trip"))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Trip>
        key={refreshKey}
        title={t('admin.trips', 'Trips')}
        endpoint="/admin/trips"
        statusOptions={TRIP_STATUSES}
        searchPlaceholder={t('admin.searchTrips', 'Search by id, address, customer, driver…')}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "id",
            header: t('admin.trip', 'Trip'),
            render: (r) => <span className="font-mono text-xs">{r.id.slice(-8)}</span>,
          },
          {
            key: "route",
            header: t('admin.route', 'Route'),
            render: (r) => (
              <div className="max-w-xs">
                <p className="truncate">{r.pickupLocation}</p>
                <p className="truncate text-xs text-muted-foreground rtl:-scale-x-100 w-fit">→ <span className="rtl:-scale-x-100 inline-block">{r.dropoffLocation}</span></p>
              </div>
            ),
          },
          {
            key: "customer",
            header: t('admin.customer', 'Customer'),
            render: (r) => r.customer?.name ?? r.customer?.phone ?? "—",
          },
          {
            key: "driver",
            header: t('admin.driver', 'Driver'),
            render: (r) =>
              r.driver?.name ?? r.driver?.phone
                ? `${r.driver?.name ?? r.driver?.phone}${r.vehicle?.plateNumber ? ` · ${r.vehicle.plateNumber}` : ""}`
                : t('admin.unassigned', 'Unassigned'),
          },
          {
            key: "fare",
            header: t('admin.fare', 'Fare'),
            render: (r) => (r.fare != null ? `${Number(r.fare).toLocaleString()} AFN` : "—"),
          },
          { key: "status", header: t('admin.status', 'Status'), render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "createdAt",
            header: t('admin.created', 'Created'),
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
          {
            key: "actions",
            header: t('admin.actions', 'Actions'),
            render: (r) =>
              r.status !== "CANCELLED" && r.status !== "COMPLETED" ? (
                <Button variant="destructive" size="sm" onClick={() => cancelTrip(r.id)}>
                  <Ban className="me-2 h-4 w-4" />
                  {t('admin.cancel', 'Cancel')}
                </Button>
              ) : null,
          },
        ]}
      />
    </AuthGate>
  )
}
