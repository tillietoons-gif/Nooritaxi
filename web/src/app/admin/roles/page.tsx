"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassSurface } from "@/components/ui/glass-surface"
import { Input } from "@/components/ui/input"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, Edit2, Key, LoaderCircle, Plus, Shield, Trash2, Users } from "lucide-react"

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

type RoleFormState = {
  name: string
  description: string
  permissions: string[]
}

const EMPTY_FORM: RoleFormState = {
  name: "",
  description: "",
  permissions: [],
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

export default function RolesAdminPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM)

  const permissionGroups = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const key = permission.module
      if (!groups[key]) groups[key] = []
      groups[key].push(permission)
      return groups
    }, {})
  }, [permissions])

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
      setError(err instanceof Error ? err.message : "Failed to load roles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function openCreateDialog() {
    setEditingRoleId(null)
    setForm(EMPTY_FORM)
    setSubmitError(null)
    setDialogOpen(true)
  }

  function openEditDialog(role: Role) {
    if (role.isSystem) return
    setEditingRoleId(role.id)
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions.map((entry) => entry.permission.name),
    })
    setSubmitError(null)
    setDialogOpen(true)
  }

  function closeDialog(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setSubmitError(null)
    }
  }

  function togglePermission(permissionName: string) {
    setForm((current) => {
      const selected = current.permissions.includes(permissionName)
      return {
        ...current,
        permissions: selected
          ? current.permissions.filter((item) => item !== permissionName)
          : [...current.permissions, permissionName],
      }
    })
  }

  async function submitRole() {
    const trimmedName = form.name.trim()
    const trimmedDescription = form.description.trim()

    if (!trimmedName) {
      setSubmitError("Role name is required")
      return
    }

    setSaving(true)
    setSubmitError(null)
    try {
      const response = await authedFetch(editingRoleId ? `/admin/roles/${editingRoleId}` : "/admin/roles", {
        method: editingRoleId ? "PUT" : "POST",
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription || undefined,
          permissions: form.permissions,
        }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      setDialogOpen(false)
      setForm(EMPTY_FORM)
      setEditingRoleId(null)
      await loadData()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save role")
    } finally {
      setSaving(false)
    }
  }

  async function deleteRole(role: Role) {
    if (role.isSystem) return
    if (!confirm(`Delete role "${role.name}"?`)) return

    try {
      const response = await authedFetch(`/admin/roles/${role.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role")
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <main className="flex-1 px-4 py-8 md:px-8 relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none opacity-20">
            <PatternOverlay />
          </div>

          <div className="mx-auto max-w-7xl space-y-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h1 className="text-3xl font-black">Role Management</h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {loading ? "Loading roles..." : `Found ${roles.length.toLocaleString()} configured roles`}
                </p>
              </div>
              <Link href="/admin" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                ← Back to Overview
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassSurface variant="premium" className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">RBAC Workspace</label>
                  <p className="text-sm font-medium text-muted-foreground">
                    Manage RBAC roles and assign granular permissions.
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" /> Create Role
                </Button>
              </GlassSurface>
            </motion.div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-primary/10 bg-background/80">
                <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Loading roles...
                </div>
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-primary/20 bg-background/80 p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">No roles found</h2>
                <p className="mt-2 text-sm text-muted-foreground">The backend returned an empty role set for this account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => {
                  const permissionNames = role.permissions.map((entry) => entry.permission.name)
                  const visiblePermissions = permissionNames.slice(0, 4)

                  return (
                    <Card key={role.id} className="glass-premium border-primary/10">
                      <CardContent className="p-6">
                        <div className="mb-4 flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <Shield className={`h-5 w-5 ${role.isSystem ? "text-gold" : "text-primary"}`} />
                            <div>
                              <h3 className="font-bold text-lg leading-tight">{role.name}</h3>
                              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                {role.isSystem ? "Protected system role" : "Custom role"}
                              </p>
                            </div>
                          </div>
                          {role.isSystem ? (
                            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold uppercase tracking-widest bg-gold/5">
                              System
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mb-6 min-h-10 text-sm text-muted-foreground">{role.description || "No description provided."}</p>

                        <div className="mb-6 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 rounded-md bg-background/50 px-3 py-1.5 text-xs font-medium">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" /> {role._count.admins} Admins
                          </div>
                          <div className="flex items-center gap-1.5 rounded-md bg-background/50 px-3 py-1.5 text-xs font-medium">
                            <Key className="h-3.5 w-3.5 text-muted-foreground" /> {permissionNames.length} Permissions
                          </div>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-2">
                          {visiblePermissions.map((permissionName) => (
                            <Badge key={permissionName} variant="secondary" className="max-w-full truncate">
                              {permissionName}
                            </Badge>
                          ))}
                          {permissionNames.length > visiblePermissions.length ? (
                            <Badge variant="outline">+{permissionNames.length - visiblePermissions.length} more</Badge>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          {role.isSystem ? (
                            <div className="flex flex-1 items-center justify-center rounded-md border border-primary/10 bg-background/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              System managed
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs border-primary/20 hover:bg-primary/5"
                              onClick={() => openEditDialog(role)}
                              title="Edit role"
                            >
                              <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          )}
                          {!role.isSystem ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => void deleteRole(role)}
                              title="Delete role"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
          <div className="flex h-full max-h-[80vh] flex-col gap-6 overflow-hidden">
            <DialogHeader>
              <DialogTitle>{editingRoleId ? "Edit custom role" : "Create custom role"}</DialogTitle>
              <DialogDescription>
                Choose a role name, add an optional description, and assign granular permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-foreground">
                <span className="mb-2 block">Role name</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Operations Analyst"
                  disabled={saving}
                />
              </label>

              <label className="block text-sm font-medium text-foreground md:col-span-2">
                <span className="mb-2 block">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explain what this role can manage."
                  disabled={saving}
                  className="min-h-24 w-full rounded-md border border-primary/20 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-primary/10 bg-background/40 p-4">
              <div className="space-y-5">
                {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => (
                  <section key={moduleName}>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                      {moduleName}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {modulePermissions.map((permission) => {
                        const checked = form.permissions.includes(permission.name)

                        return (
                          <label
                            key={permission.id}
                            className="flex cursor-pointer gap-3 rounded-xl border border-primary/10 bg-background/70 p-3 transition hover:border-primary/30"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={saving}
                              onChange={() => togglePermission(permission.name)}
                              className="mt-1 h-4 w-4 rounded border-primary/30"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{permission.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {permission.description || `${permission.module}.${permission.action}`}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {submitError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {submitError}
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={() => void submitRole()} disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingRoleId ? "Save changes" : "Create role"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
