"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, Globe, User, LayoutDashboard, ChevronDown } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NooriLogo } from "@/components/ui/noori-logo"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { getDefaultRouteForRole, getStoredUser, clearSession, type AuthUser } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const { i18n, t } = useTranslation()

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const publicNavigation = [
    { name: t("nav.rides"), href: "/rides" },
    { name: t("nav.delivery"), href: "/delivery" },
    { name: t("nav.services"), href: "/services" },
    { name: t("nav.partners"), href: "/partners" },
    { name: t("nav.safety"), href: "/safety" },
    { name: t("nav.about"), href: "/about" },
  ]

  const adminNavigation = [
    { name: "Overview", href: "/admin" },
    { name: "Drivers", href: "/admin/drivers" },
    { name: "Users", href: "/admin/users" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Support", href: "/admin/support" },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLang = i18n.language === 'fa' ? 'Dari' : i18n.language === 'ps' ? 'Pashto' : 'English'
  const pathname = usePathname()
  const isAdminUser = user?.role === "ADMIN" || user?.role === "SUPPORT"
  const navigation = isAdminUser ? adminNavigation : publicNavigation
  const homeHref = isAdminUser ? "/admin" : "/"
  const actionHref = getDefaultRouteForRole(user?.role)
  const actionLabel = isAdminUser ? "Admin Console" : "Dashboard"
  const isActiveRoute = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-500 px-4 pt-6">
      <motion.div
        animate={{
          height: isScrolled ? "64px" : "80px",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0)",
          backdropFilter: isScrolled ? "blur(20px)" : "blur(0px)",
          boxShadow: isScrolled ? "0 20px 40px rgba(0, 105, 71, 0.05)" : "none",
          border: isScrolled ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0)"
        }}
        className="container mx-auto flex items-center justify-between px-8 rounded-3xl dark:bg-black/20"
      >
        <div className="flex items-center gap-12">
          <Link href={homeHref} className="flex items-center space-x-3 group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md outline-none transition-shadow">
            <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all duration-500">
              <NooriLogo size={24} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary font-heading uppercase">Noori</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-10">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-xs font-black uppercase tracking-[0.2em] transition-all relative group focus-visible:text-primary outline-none",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                  <span className={cn(
                    "absolute -bottom-1 left-0 h-[1.5px] bg-primary transition-all duration-500 group-hover:w-full",
                    isActive ? "w-full" : "w-0"
                  )} />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden items-center space-x-6 md:flex">
             <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-primary/60 hover:text-primary cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm outline-none">
                  <Globe className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{currentLang}</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-premium border-none min-w-[120px]">
                  <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-[10px] font-black uppercase cursor-pointer">English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('fa')} className="text-[10px] font-black uppercase cursor-pointer">Dari</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('ps')} className="text-[10px] font-black uppercase cursor-pointer">Pashto</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>

             <ThemeToggle />

             {user ? (
               <div className="flex items-center gap-4">
                 <Button asChild variant="ghost" size="sm" className="rounded-full font-black text-[10px] uppercase tracking-widest gap-2">
                    <Link href={actionHref} aria-label={`Go to ${actionLabel}`}>
                       <LayoutDashboard className="h-3.5 w-3.5" /> {actionLabel}
                    </Link>
                 </Button>
                 <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                    <User className="h-4 w-4" />
                 </div>
               </div>
             ) : (
               <>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">{t("nav.login")}</Link>
                <Button size="sm" className="rounded-full px-8 h-10 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" asChild>
                  <Link href="/signup">{t("nav.signup")}</Link>
                </Button>
               </>
             )}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full h-10 w-10 glass" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            } />
            <SheetContent side="right" className="w-full sm:w-[400px] glass-premium border-none">
              <div className="flex flex-col h-full py-12 px-6">
                <div className="flex items-center space-x-3 mb-16">
                  <NooriLogo size={40} className="text-primary" />
                  <span className="text-3xl font-black tracking-tighter text-primary font-heading uppercase">Noori</span>
                </div>

                <nav className="flex flex-col space-y-8">
                  {navigation.map((item, i) => {
                    const isActive = isActiveRoute(item.href)
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={item.name}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "text-4xl font-black transition-colors font-heading",
                            isActive ? "text-primary" : "hover:text-primary"
                          )}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                <div className="mt-auto space-y-6">
                  <div className="h-[1px] w-full bg-border/50" />
                  <div className="flex gap-4">
                     <Button variant="outline" size="sm" onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'border-primary text-primary' : ''}>EN</Button>
                     <Button variant="outline" size="sm" onClick={() => changeLanguage('fa')} className={i18n.language === 'fa' ? 'border-primary text-primary' : ''}>Dari</Button>
                     <Button variant="outline" size="sm" onClick={() => changeLanguage('ps')} className={i18n.language === 'ps' ? 'border-primary text-primary' : ''}>Pashto</Button>
                  </div>
                  {user ? (
                    <div className="flex flex-col gap-4">
                       <Button className="w-full h-14 rounded-2xl font-black text-lg" onClick={() => { setIsOpen(false); window.location.href=actionHref }}>
                         {isAdminUser ? t("nav.admin") : t("nav.dashboard")} 
                       </Button>
                       <Button variant="ghost" className="w-full h-14 rounded-2xl font-black text-lg" onClick={() => { clearSession(); setIsOpen(false); window.location.reload() }}>
                         Terminate Session
                       </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-lg glass" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>{t("nav.login")}</Link>
                      </Button>
                      <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30" asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>{t("nav.signup")}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  )
}
