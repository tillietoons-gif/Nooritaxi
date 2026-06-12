"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  RefreshCw,
  KeyRound,
  LoaderCircle,
  FilterX
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"
import { useTranslation } from "react-i18next"
import { GlassSurface } from "@/components/ui/glass-surface"

type AdminUser = {
  id: string
  phone: string
  email?: string | null
  name?: string | null
  roles: { id: string; name: string; isSystem: boolean }[]
}

type Role = {
  id: string
  name: string
  description?: string | null
  isSystem: boolean
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState("")
  const [, setError] = useState<string | null>(null)

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const [usrRes, rolRes] = await Promise.all([
        authedFetch("/admin/admin-users"),
        authedFetch("/admin/roles")
      ])

      if (usrRes.ok) setUsers(await usrRes.json())
      if (rolRes.ok) setRoles(await rolRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.failedLoadAdminUsers', "Failed to load admin users"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const filteredUsers = users.filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title={t('admin.administratorAccess', "Administrator Access")}
            subtitle={t('admin.manageInternalUsers', "Manage internal users, security roles, and platform permissions.")}
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`me-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {t('admin.refresh', "Refresh")}
              </Button>
            }
          />

          <GlassSurface className="overflow-hidden p-0">
            <div className="bg-primary/5 p-4 border-b border-primary/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight">{t('admin.staffMembers', "Staff Members")}</h2>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.filterByNamePhoneEmail', "Filter by name, phone, email...")} className="ps-9 bg-background/50" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">{t('admin.administrator', "Administrator")}</th>
                    <th className="px-6 py-4">{t('admin.assignedRoles', "Assigned Roles")}</th>
                    <th className="px-6 py-4 text-end">{t('admin.actions', "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                        <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-2 text-primary/50" />
                        <span className="font-bold uppercase tracking-widest text-xs">{t('admin.accessingPersonnelDirectory', "Accessing personnel directory...")}</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                        <FilterX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <span>{t('admin.noStaffFound', "No staff members found.")}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors align-top">
                        <td className="px-6 py-4">
                          <div className="font-bold tracking-tight">{u.name ?? t('admin.anonymous', "Anonymous")}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{u.phone} {u.email ? `· ${u.email}` : ""}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map(r => (
                              <Badge key={r.id} variant={r.isSystem ? "default" : "secondary"} className="text-[9px] font-black uppercase tracking-widest">
                                {r.name}
                              </Badge>
                            ))}
                            {u.roles.length === 0 && <span className="text-xs text-muted-foreground italic">{t('admin.noRolesAssigned', "No roles assigned")}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 font-bold">{t('admin.roles', "Roles")}</Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary"><KeyRound className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassSurface>
        </div>
      </main>
    </AuthGate>
  )
}