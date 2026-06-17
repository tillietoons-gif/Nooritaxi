"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, LayoutDashboard, Car, Bell, Search, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AuthGate } from "@/components/auth-gate"
import { UserMenu } from "@/components/user-menu"
import { fetchMe, getStoredUser, type AuthUser } from "@/lib/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchMe().then((currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      }
    })
  }, [])

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "SUPPORT") {
      window.location.href = "/admin"
    }
  }, [user?.role])

  const sidebarItems = [
    { name: "Overview", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
    { name: "Book", icon: <Car className="h-5 w-5" />, href: "/book" },
    { name: "Safety", icon: <ShieldCheck className="h-5 w-5" />, href: "/safety" },
  ]

  if (user?.role === "ADMIN" || user?.role === "SUPPORT") {
    return null
  }

  return (
    <AuthGate>
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-card">
        <div className="p-6"><Link href="/" className="flex items-center space-x-2"><ShieldCheck className="h-8 w-8 text-primary" /><span className="text-xl font-bold text-primary">NooriTaxi</span></Link></div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarItems.map((item) => ( <Link key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent text-muted-foreground">{item.icon}{item.name}</Link> ))}
        </nav>
        <div className="p-4 mt-auto">
          <Separator className="mb-4" />
          <UserMenu />
        </div>
      </aside>
      <div className="flex-1 lg:pl-64">
        <header className="h-16 border-b bg-card sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
           <div className="relative w-full max-w-md hidden md:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search..."
               className="pl-10 pr-10 bg-muted/50 border-none h-10"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
             {search && (
               <button
                 onClick={() => setSearch("")}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                 aria-label="Clear search"
               >
                 <X className="h-4 w-4" />
               </button>
             )}
           </div>
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" aria-label="Notifications">
               <Bell className="h-5 w-5" />
             </Button>
             <Button variant="ghost" size="sm" className="font-semibold text-primary">Help</Button>
           </div>
        </header>
        <main id="main-content" className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
    </AuthGate>
  )
}
