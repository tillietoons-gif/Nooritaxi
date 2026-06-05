"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GlassSurface } from "@/components/ui/glass-surface"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, Check, KeySquare, LoaderCircle, RefreshCw, Shield, X } from "lucide-react"

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
  permissions: Array<{
    permission: Permission
  }>
  _count: {
    admins: number
  }
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(payload.message)) return payload.message.join(", ")
    if (payload.message) return payload.message
  } catch {
    // Ignore invalid JSON responses.
  }

  return `Request failed with ${response.status}`
}

function formatLabel(value: string) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function PermissionsMatrixPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const permissionLookup = useMemo(() => {
    return roles.reduce<Record<string, Set<string>>>((lookup, role) => {
      lookup[role.id] = new Set(role.permissions.map((entry) => entry.permission.name))
      return lookup
    }, {})
  }, [roles])

  const permissionGroups = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const key = permission.module
      if (!groups[key]) groups[key] = []
      groups[key].push(permission)
      return groups
    }, {})
  }, [permissions])

  const moduleEntries = useMemo(() => {
    return Object.entries(permissionGroups).sort(([left], [right]) => left.localeCompare(right))
  }, [permissionGroups])

  const systemRoleCount = useMemo(() => roles.filter((role) => role.isSystem).length, [roles])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        authedFetch("/admin/roles"),
        authedFetch("/admin/roles/permissions"),
      ])

      if (!rolesResponse.ok) throw new Error(await getErrorMessage(rolesResponse))
      if (!permissionsResponse.ok) throw new Error(await getErrorMessage(permissionsResponse))

      const [rolesData, permissionsData] = await Promise.all([
        rolesResponse.json() as Promise<Role[]>,
        permissionsResponse.json() as Promise<Permission[]>,
      ])

      setRoles(rolesData)
      setPermissions(permissionsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-background/50">
        <main className="relative flex-1 overflow-hidden px-4 py-8 md:px-8">
          <div className="pointer-events-none fixed inset-0 opacity-20">
            <PatternOverlay />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h1 className="text-3xl font-black">Permission Matrix</h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {loading ? "Loading permissions..." : `Mapped ${permissions.length.toLocaleString()} permissions across ${roles.length.toLocaleString()} roles`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="border-primary/20" onClick={() => void loadData()} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Link href="/admin/roles" className="text-sm font-bold text-primary transition-colors hover:text-primary/80">
                  Manage Roles →
                </Link>
                <Link href="/admin" className="text-sm font-bold text-primary transition-colors hover:text-primary/80">
                  ← Back to Overview
                </Link>
              </div>
            </motion.div>

            <GlassSurface className="relative overflow-hidden rounded-3xl border border-primary/10 p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,179,0,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-[11px] uppercase tracking-[0.28em] text-primary">
                    RBAC Visibility
                  </Badge>
                  <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">See exactly which roles own which permissions.</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                    This matrix is live data from the RBAC APIs. It replaces the previous mock grid so role coverage, module counts, and permission descriptions now match the actual backend configuration.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-primary/10 bg-background/70 px-4 py-4 backdrop-blur">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Roles</div>
                    <div className="mt-2 flex items-center gap-2 text-2xl font-black text-foreground">
                      <Shield className="h-5 w-5 text-primary" />
                      {roles.length}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{systemRoleCount} system roles</p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-background/70 px-4 py-4 backdrop-blur">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Permissions</div>
                    <div className="mt-2 flex items-center gap-2 text-2xl font-black text-foreground">
                      <KeySquare className="h-5 w-5 text-primary" />
                      {permissions.length}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Granular RBAC actions</p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-background/70 px-4 py-4 backdrop-blur">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Modules</div>
                    <div className="mt-2 text-2xl font-black text-foreground">{moduleEntries.length}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Product areas covered</p>
                  </div>
                </div>
              </div>
            </GlassSurface>

            {error ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-primary/10 bg-background/80">
                <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Loading permission matrix...
                </div>
              </div>
            ) : permissions.length === 0 || roles.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-primary/20 bg-background/80 p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">No RBAC data available</h2>
                <p className="mt-2 text-sm text-muted-foreground">The backend returned an empty role or permission set for this account.</p>
              </div>
            ) : (
              <Card className="glass-premium overflow-hidden border-primary/10">
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-center gap-3 border-b border-primary/10 bg-background/60 px-5 py-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Permission granted
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-muted/30 bg-background/80 px-3 py-1">
                      <X className="h-3.5 w-3.5" /> Permission not granted
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-primary/10 bg-background/70 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-5 py-4 font-black">Module</th>
                          <th className="px-5 py-4 font-black">Permission</th>
                          {roles.map((role) => (
                            <th key={role.id} className="min-w-[160px] px-5 py-4 text-center font-black">
                              <div className="flex flex-col items-center gap-2">
                                <span>{role.name}</span>
                                <Badge
                                  variant="outline"
                                  className={role.isSystem ? "border-gold/30 bg-gold/5 text-[10px] uppercase tracking-[0.2em] text-gold" : "border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.2em] text-primary"}
                                >
                                  {role.isSystem ? "System" : "Custom"}
                                </Badge>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {moduleEntries.map(([moduleName, modulePermissions]) =>
                          modulePermissions.map((permission, index) => (
                            <tr key={permission.id} className="border-b border-primary/5 align-top hover:bg-muted/20">
                              {index === 0 ? (
                                <td rowSpan={modulePermissions.length} className="px-5 py-4">
                                  <div className="sticky left-0 inline-flex rounded-2xl border border-primary/10 bg-background/95 px-3 py-2 font-bold text-primary shadow-sm">
                                    {formatLabel(moduleName)}
                                  </div>
                                </td>
                              ) : null}
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="font-semibold text-foreground">{permission.name}</div>
                                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatLabel(permission.action)}</div>
                                  <p className="text-sm text-muted-foreground">{permission.description || "No description provided for this permission."}</p>
                                </div>
                              </td>
                              {roles.map((role) => {
                                const hasPermission = permissionLookup[role.id]?.has(permission.name) ?? false

                                return (
                                  <td key={`${role.id}:${permission.id}`} className="px-5 py-4 text-center">
                                    <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border ${hasPermission ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700" : "border-primary/10 bg-background/70 text-muted-foreground/50"}`}>
                                      {hasPermission ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
