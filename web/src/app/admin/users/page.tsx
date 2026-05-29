"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"
import { useState } from "react"

type AdminUser = {
  id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  role: string
  status: string
  createdAt: string
}

const USER_STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "DELETED"]

export default function AdminUsersPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  async function updateUserStatus(id: string, newStatus: string) {
    if (!confirm(`Are you sure you want to ${newStatus === 'SUSPENDED' ? 'suspend' : 'activate'} user ${id}?`)) return
    try {
      const res = await authedFetch(`/admin/users/${id}/status`, { 
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error(`Failed to ${newStatus.toLowerCase()} user`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<AdminUser>
        key={refreshKey}
        title="Users"
        endpoint="/admin/users"
        statusOptions={USER_STATUSES}
        searchPlaceholder="Search by name, phone, email…"
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Name", render: (r) => r.name ?? "—" },
          { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
          { key: "email", header: "Email", render: (r) => r.email ?? "—" },
          { key: "role", header: "Role", render: (r) => r.role },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "createdAt",
            header: "Joined",
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="flex gap-2">
                {r.status !== "SUSPENDED" && (
                  <Button variant="destructive" size="sm" onClick={() => updateUserStatus(r.id, "SUSPENDED")}>
                    Suspend
                  </Button>
                )}
                {r.status === "SUSPENDED" && (
                  <Button variant="default" size="sm" onClick={() => updateUserStatus(r.id, "ACTIVE")}>
                    Activate
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
    </AuthGate>
  )
}
