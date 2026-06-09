"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { canAccessWebPortal, clearSession, fetchMe, getStoredUser, getWebLoginUrl, WEB_MOBILE_ONLY_REASON, type AuthUser } from "@/lib/auth"

export function AuthGate({ children, roles }: { children: React.ReactNode; roles?: AuthUser["role"][] }) {
  const pathname = usePathname()
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading")

  useEffect(() => {
    let cancelled = false

    async function verify() {
      const user = getStoredUser() ?? await fetchMe()
      if (cancelled) return

      if (!user) {
        window.location.href = getWebLoginUrl(pathname)
        return
      }

      if (!canAccessWebPortal(user.role)) {
        clearSession()
        window.location.href = getWebLoginUrl(null, WEB_MOBILE_ONLY_REASON)
        return
      }

      if (roles?.length && !roles.includes(user.role)) {
        setState("denied")
        return
      }

      setState("allowed")
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [pathname, roles])

  if (state === "loading") return <div className="p-6 text-sm text-muted-foreground">Loading secure workspace...</div>
  if (state === "denied") return <div className="p-6 text-sm text-destructive">You do not have access to this workspace.</div>
  return <>{children}</>
}
