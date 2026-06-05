"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  PencilLine,
  KeyRound,
  LoaderCircle,
  Copy,
  Check
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : "Failed to load admin users")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Administrator Access"
            subtitle="Manage internal users, security roles, and platform permissions."
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl overflow-hidden glass-premium">
            <CardHeader className="bg-primary/5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Staff Members</CardTitle>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name, phone, email..." className="pl-9 bg-background/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="px-6 py-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Accessing personnel directory...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Administrator</th>
                        <th className="px-6 py-4">Assigned Roles</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors align-top">
                          <td className="px-6 py-4">
                            <div className="font-bold tracking-tight">{u.name ?? "Anonymous"}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{u.phone} {u.email ? `· ${u.email}` : ""}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map(r => (
                                <Badge key={r.id} variant={r.isSystem ? "default" : "secondary"} className="text-[9px] font-black uppercase tracking-widest">
                                  {r.name}
                                </Badge>
                              ))}
                              {u.roles.length === 0 && <span className="text-xs text-muted-foreground italic">No roles assigned</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 font-bold">Roles</Button>
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary"><KeyRound className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
