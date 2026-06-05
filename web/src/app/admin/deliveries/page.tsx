"use client"

import { useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"

type Delivery = {
  id: string
  orderId?: string | null
  senderId?: string | null
  driverId?: string | null
  pickupName?: string | null
  pickupAddress: string
  dropoffName?: string | null
  dropoffAddress: string
  packageType?: string | null
  status: string
  fee?: string | number | null
  distance?: number | null
  requestedAt?: string
  deliveredAt?: string | null
  createdAt: string
  sender?: { name?: string | null; phone?: string | null } | null
  driver?: { name?: string | null; phone?: string | null } | null
  vehicle?: { plateNumber?: string | null; type?: string | null } | null
  order?: { id?: string; restaurantId?: string | null } | null
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

const NEXT_STATUS: Partial<Record<string, string>> = {
  REQUESTED: "ASSIGNED",
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
}

export default function AdminDeliveriesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateDeliveryStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await authedFetch(`/admin/deliveries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
        throw new Error(message ? `Failed to update delivery: ${message}` : `Failed to update delivery (${res.status})`)
      }
      setRefreshKey((key) => key + 1)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Delivery>
        key={refreshKey}
        title="Deliveries"
        endpoint="/admin/deliveries"
        statusOptions={DELIVERY_STATUSES}
        searchPlaceholder="Search by id, pickup, or dropoff..."
        rowKey={(delivery) => delivery.id}
        columns={[
          {
            key: "id",
            header: "Delivery",
            render: (delivery) => (
              <div>
                <span className="font-mono text-xs">{delivery.id.slice(-8)}</span>
                <p className="text-xs text-muted-foreground">{delivery.orderId ? "Food order" : "Parcel"}</p>
              </div>
            ),
          },
          {
            key: "pickup",
            header: "Pickup",
            render: (delivery) => (
              <div className="max-w-xs">
                {delivery.pickupName ? <p className="font-medium">{delivery.pickupName}</p> : null}
                <p className="truncate text-muted-foreground">{delivery.pickupAddress}</p>
              </div>
            ),
          },
          {
            key: "dropoff",
            header: "Dropoff",
            render: (delivery) => (
              <div className="max-w-xs">
                {delivery.dropoffName ? <p className="font-medium">{delivery.dropoffName}</p> : null}
                <p className="truncate text-muted-foreground">{delivery.dropoffAddress}</p>
              </div>
            ),
          },
          {
            key: "driver",
            header: "Driver",
            render: (delivery) =>
              delivery.driver?.name ?? delivery.driver?.phone
                ? `${delivery.driver?.name ?? delivery.driver?.phone}${delivery.vehicle?.plateNumber ? ` · ${delivery.vehicle.plateNumber}` : ""}`
                : "Unassigned",
          },
          {
            key: "fee",
            header: "Fee",
            render: (delivery) => (delivery.fee != null ? `${Number(delivery.fee).toLocaleString()} AFN` : "-"),
          },
          {
            key: "status",
            header: "Status",
            render: (delivery) => <StatusBadge status={delivery.status} />,
          },
          {
            key: "requestedAt",
            header: "Requested",
            render: (delivery) => new Date(delivery.requestedAt ?? delivery.createdAt).toLocaleString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (delivery) => {
              const nextStatus = NEXT_STATUS[delivery.status]
              const isTerminal = ["DELIVERED", "FAILED", "CANCELLED"].includes(delivery.status)
              return (
                <div className="flex items-center gap-2">
                  {nextStatus ? (
                    <Button
                      size="sm"
                      onClick={() => updateDeliveryStatus(delivery.id, nextStatus)}
                      disabled={updatingId === delivery.id}
                    >
                      {nextStatus.replaceAll("_", " ")}
                    </Button>
                  ) : null}
                  {!isTerminal ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDeliveryStatus(delivery.id, "FAILED")}
                        disabled={updatingId === delivery.id}
                      >
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateDeliveryStatus(delivery.id, "CANCELLED")}
                        disabled={updatingId === delivery.id}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
              )
            },
          },
        ]}
      />
    </AuthGate>
  )
}
