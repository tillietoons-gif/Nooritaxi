"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/admin/admin-list-page"
import { apiUrl, authedFetch } from "@/lib/auth"
import { AlertCircle, Check, Copy, KeyRound, LoaderCircle, MapPin, PencilLine, Shield, Users } from "lucide-react"

type RoleSummary = {
  id: string
  name: string
  isSystem: boolean
  description?: string | null
}

type AdminRoleAssignment = {
  cityScope?: string | null
  role: RoleSummary
}

type AdminUser = {
  id: string
  name?: string | null
  phone: string
  email?: string | null
  role: string
  status: string
  createdAt: string
  adminRoles: AdminRoleAssignment[]
}

type RoleFormState = Record<string, string>

type PasswordResetFormState = {
  code: string
  newPassword: string
}

const EMPTY_PASSWORD_RESET_FORM: PasswordResetFormState = {
  code: "",
  newPassword: "",
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<RoleFormState>({})
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetForm, setResetForm] = useState<PasswordResetFormState>(EMPTY_PASSWORD_RESET_FORM)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [handoffPassword, setHandoffPassword] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        authedFetch("/admin/users?role=ADMIN&limit=100"),
        authedFetch("/admin/roles"),
      ])

      if (!usersResponse.ok) throw new Error(await getErrorMessage(usersResponse))
      if (!rolesResponse.ok) throw new Error(await getErrorMessage(rolesResponse))

      const usersData = (await usersResponse.json()) as {
        items: AdminUser[]
      }
      const rolesData = (await rolesResponse.json()) as RoleSummary[]

      setUsers(usersData.items)
      setRoles(rolesData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users

    return users.filter((user) => {
      const haystack = [user.name, user.phone, user.email, ...user.adminRoles.map((entry) => entry.role.name)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [search, users])

  function openAssignmentDialog(user: AdminUser) {
    setSelectedAdmin(user)
    setSubmitError(null)
    setForm(
      Object.fromEntries(
        user.adminRoles.map((assignment) => [assignment.role.id, assignment.cityScope ?? ""]),
      ),
    )
  }

  function closeAssignmentDialog(open: boolean) {
    if (!open) {
      setSelectedAdmin(null)
      setSubmitError(null)
      setForm({})
      return
    }
  }

  function openPasswordResetDialog(user: AdminUser) {
    setResetTarget(user)
    setResetForm(EMPTY_PASSWORD_RESET_FORM)
    setResetMessage(null)
    setResetError(null)
    setHandoffPassword(null)
    setCopiedPassword(false)
  }

  function closePasswordResetDialog(open: boolean) {
    if (!open) {
      setResetTarget(null)
      setResetForm(EMPTY_PASSWORD_RESET_FORM)
      setResetMessage(null)
      setResetError(null)
      setHandoffPassword(null)
      setCopiedPassword(false)
    }
  }

  function toggleRole(roleId: string) {
    setForm((current) => {
      if (roleId in current) {
        const next = { ...current }
        delete next[roleId]
        return next
      }

      return {
        ...current,
        [roleId]: "",
      }
    })
  }

  async function saveAssignments() {
    if (!selectedAdmin) return

    setSaving(true)
    setSubmitError(null)
    try {
      const assignments = Object.entries(form).map(([roleId, cityScope]) => ({
        roleId,
        cityScope: cityScope.trim() || undefined,
      }))

      const response = await authedFetch(`/admin/roles/assign/${selectedAdmin.id}`, {
        method: "POST",
        body: JSON.stringify({ assignments }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      setSelectedAdmin(null)
      setForm({})
      await loadData()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save assignments")
    } finally {
      setSaving(false)
    }
  }

  async function sendResetOtp() {
    if (!resetTarget) return

    setSendingOtp(true)
    setResetError(null)
    setResetMessage(null)
    setCopiedPassword(false)
    try {
      const response = await fetch(`${apiUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetTarget.phone }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      setResetMessage(
        `OTP sent to ${resetTarget.phone}. In local development without SMS configured, check the backend terminal for the code.`,
      )
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset OTP")
    } finally {
      setSendingOtp(false)
    }
  }

  async function resetPassword() {
    if (!resetTarget) return
    if (!resetForm.code.trim() || !resetForm.newPassword.trim()) {
      setResetError("OTP code and new password are required")
      return
    }

    const submittedPassword = resetForm.newPassword

    setResettingPassword(true)
    setResetError(null)
    setResetMessage(null)
    setCopiedPassword(false)
    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: resetTarget.phone,
          code: resetForm.code.trim(),
          newPassword: submittedPassword,
        }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      setHandoffPassword(submittedPassword)
      setResetMessage(`Password updated for ${resetTarget.name ?? resetTarget.phone}. Existing sessions have been revoked.`)
      setResetForm(EMPTY_PASSWORD_RESET_FORM)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setResettingPassword(false)
    }
  }

  async function copyHandoffPassword() {
    if (!handoffPassword) return

    try {
      await navigator.clipboard.writeText(handoffPassword)
      setCopiedPassword(true)
    } catch {
      setResetError("Unable to copy the password automatically. Copy it manually from the field below.")
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Admin Directory
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage internal admin accounts, role assignments, and city scopes.
              </BodyMd>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search admins, phones, roles..."
                className="w-72 bg-background/80"
              />
              <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <Card className="glass-premium border-primary/10">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex min-h-[240px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                    <LoaderCircle className="h-5 w-5 animate-spin" /> Loading admin directory...
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">No admin users found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Try a different search or seed another admin account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-primary/10">
                    <tr>
                      <th className="px-6 py-4 font-black">Admin</th>
                      <th className="px-6 py-4 font-black">Roles</th>
                      <th className="px-6 py-4 font-black">City Scope</th>
                      <th className="px-6 py-4 font-black">Status</th>
                      <th className="px-6 py-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {(u.name ?? u.phone)
                                  .split(" ")
                                  .map((segment) => segment[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold">{u.name ?? "Unnamed Admin"}</p>
                              <p className="text-xs text-muted-foreground">{u.email || u.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {u.adminRoles.length === 0 ? (
                              <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                                Missing RBAC role
                              </Badge>
                            ) : (
                              u.adminRoles.map((assignment) => (
                                <Badge
                                  key={`${u.id}-${assignment.role.id}-${assignment.cityScope ?? "global"}`}
                                  variant="outline"
                                  className={`text-[10px] uppercase tracking-wider ${assignment.role.name === "Super Admin" ? "border-gold text-gold bg-gold/5" : "border-primary/30 text-primary bg-primary/5"}`}
                                >
                                  <Shield className="h-3 w-3 mr-1" /> {assignment.role.name}
                                  {assignment.cityScope ? ` • ${assignment.cityScope}` : ""}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.adminRoles.some((assignment) => assignment.cityScope) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {u.adminRoles
                                .filter((assignment) => assignment.cityScope)
                                .map((assignment) => (
                                  <Badge key={`${u.id}-${assignment.role.id}-scope`} variant="secondary" className="text-[10px] uppercase bg-muted text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" /> {assignment.cityScope}
                                  </Badge>
                                ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Global</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/20 hover:bg-primary/5"
                              onClick={() => openPasswordResetDialog(u)}
                            >
                              <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/20 hover:bg-primary/5"
                              onClick={() => openAssignmentDialog(u)}
                            >
                              <PencilLine className="mr-2 h-4 w-4" /> Assign Roles
                            </Button>
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
        </main>
      </div>

      <Dialog open={Boolean(selectedAdmin)} onOpenChange={closeAssignmentDialog}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
          <div className="flex h-full max-h-[80vh] flex-col gap-6 overflow-hidden">
            <DialogHeader>
              <DialogTitle>Assign admin roles</DialogTitle>
              <DialogDescription>
                {selectedAdmin
                  ? `Update RBAC roles for ${selectedAdmin.name ?? selectedAdmin.phone}. City scope is optional and only applies when a role should be restricted.`
                  : "Update RBAC roles for this admin."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-primary/10 bg-background/40 p-4 text-sm">
              <div className="font-semibold">{selectedAdmin?.name ?? "Unknown admin"}</div>
              <div className="text-muted-foreground">{selectedAdmin?.email || selectedAdmin?.phone}</div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-primary/10 bg-background/40 p-4">
              <div className="space-y-3">
                {roles.map((role) => {
                  const checked = role.id in form

                  return (
                    <div key={role.id} className="rounded-xl border border-primary/10 bg-background/70 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <label className="flex gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={saving}
                            onChange={() => toggleRole(role.id)}
                            className="mt-1 h-4 w-4 rounded border-primary/30"
                          />
                          <span>
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              {role.name}
                              {role.isSystem ? (
                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-gold/30 text-gold bg-gold/5">
                                  System
                                </Badge>
                              ) : null}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {role.description || "No description provided."}
                            </span>
                          </span>
                        </label>

                        {checked ? (
                          <div className="w-full md:w-56">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              City Scope
                            </label>
                            <Input
                              value={form[role.id] ?? ""}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  [role.id]: event.target.value,
                                }))
                              }
                              disabled={saving}
                              placeholder="Optional, e.g. Kabul"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {submitError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {submitError}
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={() => void saveAssignments()} disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save assignments
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onOpenChange={closePasswordResetDialog}>
        <DialogContent className="sm:max-w-xl">
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>Reset admin password</DialogTitle>
              <DialogDescription>
                {resetTarget
                  ? `Send a one-time code to ${resetTarget.name ?? resetTarget.phone} and set a new password once the code is received.`
                  : "Reset this admin password with an OTP challenge."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-primary/10 bg-background/40 p-4 text-sm">
              <div className="font-semibold">{resetTarget?.name ?? "Unknown admin"}</div>
              <div className="text-muted-foreground">{resetTarget?.phone}</div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-primary/10 bg-background/40 p-4">
                <div className="mb-3 text-sm font-semibold">Step 1: Send OTP</div>
                <p className="mb-4 text-sm text-muted-foreground">
                  This uses the same OTP channel as account verification. In local dev, the backend logs the OTP when no SMS provider is configured.
                </p>
                <Button variant="outline" onClick={() => void sendResetOtp()} disabled={sendingOtp || resettingPassword}>
                  {sendingOtp ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Send Reset OTP
                </Button>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-background/40 p-4">
                <div className="mb-4 text-sm font-semibold">Step 2: Apply New Password</div>
                <div className="grid gap-4">
                  <label className="block text-sm font-medium text-foreground">
                    <span className="mb-2 block">OTP code</span>
                    <Input
                      value={resetForm.code}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                      placeholder="123456"
                      disabled={resettingPassword}
                    />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    <span className="mb-2 block">New password</span>
                    <Input
                      type="password"
                      value={resetForm.newPassword}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="Minimum 12 characters"
                      disabled={resettingPassword}
                    />
                  </label>
                </div>
              </div>
            </div>

            {resetMessage ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-medium text-primary">
                <div>{resetMessage}</div>
                {handoffPassword ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-primary/15 bg-background/70 p-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">Temporary Password</div>
                      <div className="mt-1 truncate font-mono text-sm text-foreground">{handoffPassword}</div>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void copyHandoffPassword()}>
                      {copiedPassword ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copiedPassword ? "Copied" : "Copy Password"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {resetError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {resetError}
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={() => void resetPassword()} disabled={resettingPassword || sendingOtp}>
                {resettingPassword ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
