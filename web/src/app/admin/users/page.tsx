"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"

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
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<AdminUser>
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
        ]}
      />
    </AuthGate>
  )
}
