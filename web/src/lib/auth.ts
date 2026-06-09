export type AuthUser = {
  id: string
  phone: string
  name?: string
  role: "RIDER" | "DRIVER" | "MERCHANT" | "SUPPORT" | "ADMIN"
}

export const WEB_MOBILE_ONLY_REASON = "mobile-only"

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export function getToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("noori_token")
}

export function saveSession(token: string, user: AuthUser) {
  window.localStorage.setItem("noori_token", token)
  window.localStorage.setItem("noori_user", JSON.stringify(user))
}

export function canAccessWebPortal(role?: AuthUser["role"] | null) {
  return role !== "DRIVER"
}

export function getWebLoginUrl(next?: string | null, reason?: string) {
  const params = new URLSearchParams()
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next)
  }
  if (reason) {
    params.set("reason", reason)
  }
  const query = params.toString()
  return query ? `/login?${query}` : "/login"
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem("noori_user")
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as AuthUser
    if (!canAccessWebPortal(user.role)) {
      clearSession()
      return null
    }
    return user
  } catch {
    return null
  }
}

export function clearSession() {
  window.localStorage.removeItem("noori_token")
  window.localStorage.removeItem("noori_user")
}

export function getDefaultRouteForRole(role?: AuthUser["role"] | null) {
  if (!canAccessWebPortal(role)) {
    return getWebLoginUrl(null, WEB_MOBILE_ONLY_REASON)
  }
  return role === "ADMIN" || role === "SUPPORT" ? "/admin" : "/dashboard"
}

export function getPostAuthRedirect(user?: Pick<AuthUser, "role"> | null, next?: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }

  return getDefaultRouteForRole(user?.role)
}

export async function fetchMe() {
  const token = getToken()
  if (!token) return null
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    clearSession()
    return null
  }
  const data = await response.json()
  if (data.user && !canAccessWebPortal(data.user.role)) {
    clearSession()
    return null
  }
  if (data.user) window.localStorage.setItem("noori_user", JSON.stringify(data.user))
  return data.user as AuthUser
}

export async function authedFetch(path: string, init: RequestInit = {}) {
  const token = getToken()
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
