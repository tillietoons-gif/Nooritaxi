"use client"

import { useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"

type Order = {
  id: string
  status: string
  total?: string | number | null
  paymentMethod?: string
  deliveryAddress?: string
  placedAt?: string
  createdAt: string
  restaurant?: { name?: string | null } | null
  items?: { quantity?: number; menuItem?: { name?: string | null } | null }[]
  delivery?: { status?: string } | null
}

const ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]

const NEXT_STATUS: Partial<Record<string, string>> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
}

export default function AdminOrdersPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateOrderStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await authedFetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
        throw new Error(message ? `Failed to update order: ${message}` : `Failed to update order (${res.status})`)
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
      <AdminListPage<Order>
        key={refreshKey}
        title="Food Orders"
        endpoint="/admin/orders"
        statusOptions={ORDER_STATUSES}
        searchPlaceholder="Search by id, address, restaurant…"
        rowKey={(r) => r.id}
        columns={[
          {
            key: "id",
            header: "Order",
            render: (r) => <span className="font-mono text-xs">{r.id.slice(-8)}</span>,
          },
          {
            key: "restaurant",
            header: "Restaurant",
            render: (r) => r.restaurant?.name ?? "—",
          },
          {
            key: "items",
            header: "Items",
            render: (r) =>
              r.items?.length
                ? r.items
                    .map((i) => `${i.quantity ?? 1}× ${i.menuItem?.name ?? "?"}`)
                    .join(", ")
                : "—",
          },
          {
            key: "address",
            header: "Delivery to",
            render: (r) => r.deliveryAddress ?? "—",
          },
          {
            key: "total",
            header: "Total",
            render: (r) => (r.total != null ? `${Number(r.total).toLocaleString()} AFN` : "—"),
          },
          { key: "payment", header: "Pay", render: (r) => r.paymentMethod ?? "—" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "createdAt",
            header: "Placed",
            render: (r) => new Date(r.placedAt ?? r.createdAt).toLocaleString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => {
              const nextStatus = NEXT_STATUS[r.status]
              const isTerminal = ["DELIVERED", "CANCELLED", "REFUNDED"].includes(r.status)
              return (
                <div className="flex items-center gap-2">
                  {nextStatus ? (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(r.id, nextStatus)}
                      disabled={updatingId === r.id}
                    >
                      {nextStatus.replaceAll("_", " ")}
                    </Button>
                  ) : null}
                  {!isTerminal ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateOrderStatus(r.id, "CANCELLED")}
                      disabled={updatingId === r.id}
                    >
                      Cancel
                    </Button>
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
