"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Banknote,
  Car,
  Crown,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Network,
  ShieldAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { NooriLogo } from "@/components/ui/noori-logo"
import { clearSession, getStoredUser, type AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const adminNavigation: AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Drivers", href: "/admin/drivers", icon: Car },
  { label: "Trips", href: "/admin/trips", icon: Map },
  { label: "Orders", href: "/admin/orders", icon: Map },
  { label: "Support", href: "/admin/support", icon: Headphones },
  { label: "Operations", href: "/admin/operations", icon: Network },
  { label: "Fraud", href: "/admin/fraud", icon: ShieldAlert },
  { label: "CMS", href: "/admin/cms", icon: FileText },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: Crown },
  { label: "Finance", href: "/admin/finance", icon: Banknote },
]

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
}

export function AdminShellHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  function signOut() {
    clearSession()
    window.location.href = "/login"
  }

  const userLabel = user?.name || user?.phone || "Admin user"
  const roleLabel = user?.role === "SUPPORT" ? "Support" : "Admin"

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3 rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
              <NooriLogo size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-wide text-primary">Noori Admin</span>
              <span className="block truncate text-xs text-muted-foreground">Operations workspace</span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="max-w-52 text-right">
              <p className="truncate text-sm font-semibold">{userLabel}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <ThemeToggle />
            <Button type="button" variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <nav className="hidden gap-1 overflow-x-auto border-t py-2 md:flex" aria-label="Admin navigation">
          {adminNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {mobileOpen ? (
          <div className="border-t py-3 md:hidden">
            <div className="mb-3 rounded-md bg-muted/60 px-3 py-2">
              <p className="truncate text-sm font-semibold">{userLabel}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <nav className="grid grid-cols-2 gap-2" aria-label="Admin navigation">
              {adminNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
