"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Menu, Globe } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const navigation = [
    { name: "Services", href: "/#services" },
    { name: "Safety", href: "/safety" },
    { name: "Partners", href: "/partners" },
    { name: "Company", href: "/about" },
  ]
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">NooriTaxi</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => ( <Link key={item.name} href={item.href} className="transition-colors hover:text-primary">{item.name}</Link> ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-2 md:flex">
             <Button variant="ghost" size="sm" className="gap-2"><Globe className="h-4 w-4" />EN</Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm">Log In</Button>
            <Button size="sm">Sign Up</Button>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={ <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-6 w-6" /></Button> } />
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8 px-4">
                {navigation.map((item) => ( <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-primary">{item.name}</Link> ))}
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="outline" className="w-full">Log In</Button>
                  <Button className="w-full">Sign Up</Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
