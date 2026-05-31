"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Globe, User, LayoutDashboard, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NooriLogo } from "@/components/ui/noori-logo"
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion"
import { getStoredUser, clearSession } from "@/lib/auth"
import { LabelMd } from "@/components/ui/typography"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const navigation = [
    { name: "Solutions", href: "/#services" },
    { name: "Logistics", href: "/#services" },
    { name: "Safety", href: "/safety" },
    { name: "About", href: "/about" },
  ]

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
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all duration-500">
              <NooriLogo size={24} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary font-heading uppercase">Noori</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-primary transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden items-center space-x-6 md:flex">
             <div className="flex items-center gap-1 text-primary/60 hover:text-primary cursor-pointer transition-colors">
               <Globe className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">AF-EN</span>
             </div>

             <ThemeToggle />

             {user ? (
               <div className="flex items-center gap-4">
                 <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="rounded-full font-black text-[10px] uppercase tracking-widest gap-2">
                       <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                    </Button>
                 </Link>
                 <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                    <User className="h-4 w-4" />
                 </div>
               </div>
             ) : (
               <>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Log In</Link>
                <Button size="sm" className="rounded-full px-8 h-10 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" asChild>
                  <Link href="/signup">Establish Access</Link>
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
                  {navigation.map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={item.name}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="text-4xl font-black hover:text-primary transition-colors font-heading"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto space-y-6">
                  <div className="h-[1px] w-full bg-border/50" />
                  {user ? (
                    <div className="flex flex-col gap-4">
                       <Button className="w-full h-14 rounded-2xl font-black text-lg" onClick={() => { setIsOpen(false); window.location.href="/dashboard" }}>
                         Command Center
                       </Button>
                       <Button variant="ghost" className="w-full h-14 rounded-2xl font-black text-lg" onClick={() => { clearSession(); setIsOpen(false); window.location.reload() }}>
                         Terminate Session
                       </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-lg glass" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>Log In</Link>
                      </Button>
                      <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30" asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>Establish Access</Link>
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
