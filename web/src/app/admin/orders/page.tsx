"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"

type Order = {
  id: string
  status: string
  total?: string | number | null
  paymentMethod?: string
  deliveryAddress?: string
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
]

export default function AdminOrdersPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Order>
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
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
        ]}
      />
    </AuthGate>
  )
}
