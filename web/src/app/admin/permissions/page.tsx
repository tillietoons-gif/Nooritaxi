"use client"

import React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Check,
  X,
  LoaderCircle,
  AlertCircle
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  isSystem: boolean
  permissions: Permission[]
}

export default function AdminPermissionsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModule, setSelectedModule] = useState("all")
  const [selectedRoleId, setSelectedRoleId] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const [roleRes, permRes] = await Promise.all([
        authedFetch("/admin/roles"),
        authedFetch("/admin/permissions")
      ])

      if (roleRes.ok) setRoles(await roleRes.json())
      if (permRes.ok) setPermissions(await permRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RBAC data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const formatLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const permissionLookup = useMemo(() => {
    const lookup: Record<string, Set<string>> = {}
    roles.forEach(role => {
      lookup[role.id] = new Set(role.permissions.map(p => p.name))
    })
    return lookup
  }, [roles])

  const modules = useMemo(() => {
    const m = new Set<string>()
    permissions.forEach(p => m.add(p.module))
    return Array.from(m).sort()
  }, [permissions])

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesModule = selectedModule === "all" || p.module === selectedModule
      return matchesSearch && matchesModule
    })
  }, [permissions, searchQuery, selectedModule])

  const visibleRoles = roles.filter(r => selectedRoleId === "all" || r.id === selectedRoleId)

  const moduleGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    filteredPermissions.forEach(p => {
      if (!groups[p.module]) groups[p.module] = []
      groups[p.module].push(p)
    })
    return groups
  }, [filteredPermissions])

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Access Control"
            subtitle="Manage roles, permissions, and security policies across the platform."
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl overflow-hidden glass-premium">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Search Permissions</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter by name..." className="pl-9 bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Module</label>
                  <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm">
                    <option value="all">All Modules</option>
                    {modules.map(m => <option key={m} value={m}>{formatLabel(m)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role Focus</label>
                  <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm">
                    <option value="all">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">{error}</div>}

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border border-primary/10 bg-background/50 animate-pulse">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary/50 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing RBAC Matrix...</p>
            </div>
          ) : (
            <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-primary/10 bg-background/70 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Module / Permission</th>
                        {visibleRoles.map(r => (
                          <th key={r.id} className="px-6 py-4 text-center min-w-[120px]">{r.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {Object.entries(moduleGroups).map(([module, perms]) => (
                        <React.Fragment key={module}>
                          <tr className="bg-primary/5">
                            <td colSpan={visibleRoles.length + 1} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                              {formatLabel(module)}
                            </td>
                          </tr>
                          {perms.map(p => (
                            <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-sm tracking-tight">{p.name}</div>
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{formatLabel(p.action)}</div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                              </td>
                              {visibleRoles.map(r => {
                                const has = permissionLookup[r.id]?.has(p.name)
                                return (
                                  <td key={r.id} className="px-6 py-4 text-center">
                                    <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center ${has ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted/50 text-muted-foreground/30"}`}>
                                      {has ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthGate>
  )
}
