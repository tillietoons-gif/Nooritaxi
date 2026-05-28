"use client"

import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { clearSession, fetchMe, getStoredUser, type AuthUser } from "@/lib/auth"

export function UserMenu() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
    fetchMe().then(setUser)
  }, [])

  function logout() {
    clearSession()
    window.location.href = "/"
  }

  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "NO"

  return (
    <div className="flex items-center gap-3 px-3">
      <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{user?.name ?? "Noori User"}</span>
        <span className="text-xs text-muted-foreground">{user?.role ?? "SIGNED_IN"}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out"><LogOut className="h-4 w-4" /></Button>
    </div>
  )
}
