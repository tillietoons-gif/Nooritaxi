"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Shield,
  Trash2,
  Plus,
  RefreshCw
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"

type Permission = {
  id: string
  name: string
  module: string
  action: string
  description?: string | null
}

type Role = {
  id: string
  name: string
  description?: string | null
  isSystem: boolean
  permissions: { permission: Permission }[]
  _count: { admins: number }
}

export default function AdminRolesPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [, setPermissions] = useState<Permission[]>([])
  const [, setError] = useState<string | null>(null)

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const [roleRes, permRes] = await Promise.all([
        authedFetch("/admin/roles?include=permissions,admins"),
        authedFetch("/admin/permissions")
      ])

      if (roleRes.ok) setRoles(await roleRes.json())
      if (permRes.ok) setPermissions(await permRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="RBAC Roles"
            subtitle="Configure security roles and assign granular capability sets."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> New Role
                </Button>
              </div>
            }
          />

          {loading ? (
            <div className="px-6 py-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Accessing security descriptors...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id} className="border-primary/10 shadow-xl glass-premium hover:border-primary/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${role.isSystem ? "bg-gold/10 text-gold" : "bg-primary/10 text-primary"}`}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg tracking-tight">{role.name}</h3>
                          {role.isSystem && <span className="text-[9px] font-black uppercase tracking-widest text-gold">System Managed</span>}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-6">{role.description || "No description provided for this security role."}</p>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-xl font-black text-foreground">{role._count.admins}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-foreground">{role.permissions.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Capabilities</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 font-bold text-[10px] uppercase tracking-widest border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        {role.isSystem ? "View Details" : "Edit Role"}
                      </Button>
                      {!role.isSystem && (
                        <Button variant="outline" size="icon" className="h-9 w-9 border-destructive/20 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGate>
  )
}
