"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Globe } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NooriLogo } from "@/components/ui/noori-logo"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const navigation = [
    { name: "Services", href: "/#services" },
    { name: "Safety", href: "/safety" },
    { name: "Partners", href: "/partners" },
    { name: "Company", href: "/about" },
  ]

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 px-4 pt-4">
      <motion.div
        className={`container mx-auto flex h-16 items-center justify-between px-6 rounded-2xl transition-all duration-300 ${
          isScrolled ? "glass" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <NooriLogo size={32} className="text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-primary">Noori</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="transition-colors hover:text-primary relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-3 md:flex">
            <Button variant="ghost" size="sm" className="gap-2 font-semibold">
              <Globe className="h-4 w-4" />EN
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="font-semibold" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="sm" className="font-semibold px-6 shadow-lg shadow-primary/20" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] glass">
              <nav className="flex flex-col space-y-6 mt-12 px-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-bold hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col space-y-3 pt-8">
                  <Button variant="outline" className="w-full font-bold" asChild>
                    <Link href="/login" onClick={() => setIsOpen(false)}>Log In</Link>
                  </Button>
                  <Button className="w-full font-bold shadow-lg shadow-primary/20" asChild>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  )
}
