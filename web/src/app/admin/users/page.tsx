"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Ban, CheckCircle } from "lucide-react"

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
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  async function updateUserStatus(id: string, newStatus: string) {
    if (!confirm(`${t("admin.are_you_sure_status", "Are you sure you want to change the status of this user?")}`)) return
    try {
      const res = await authedFetch(`/admin/users/${id}/status`, { 
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error(t("admin.failed_to_update_status", "Failed to update user status"))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<AdminUser>
        key={refreshKey}
        title={t("admin.users_title", "Users")}
        endpoint="/admin/users"
        statusOptions={USER_STATUSES}
        searchPlaceholder={t("admin.search_users_placeholder", "Search by name, phone, email…")}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: t("admin.name", "Name"), render: (r) => <span className="font-medium">{r.name ?? "—"}</span> },
          { key: "phone", header: t("admin.phone", "Phone"), render: (r) => r.phone ?? "—" },
          { key: "email", header: t("admin.email", "Email"), render: (r) => <span className="text-muted-foreground">{r.email ?? "—"}</span> },
          { key: "role", header: t("admin.role", "Role"), render: (r) => <span className="text-xs font-bold uppercase tracking-wider">{r.role}</span> },
          { key: "status", header: t("admin.status", "Status"), render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "createdAt",
            header: t("admin.joined", "Joined"),
            render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleString()}</span>,
          },
          {
            key: "actions",
            header: t("admin.actions", "Actions"),
            render: (r) => (
              <div className="flex gap-2">
                {r.status !== "SUSPENDED" && (
                  <Button variant="outline" size="sm" onClick={() => updateUserStatus(r.id, "SUSPENDED")} className="border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors">
                    <Ban className="h-4 w-4 me-2" />
                    {t('admin.suspend', 'Suspend')}
                  </Button>
                )}
                {r.status === "SUSPENDED" && (
                  <Button variant="outline" size="sm" onClick={() => updateUserStatus(r.id, "ACTIVE")} className="border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                    <CheckCircle className="h-4 w-4 me-2" />
                    {t('admin.activate', 'Activate')}
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
