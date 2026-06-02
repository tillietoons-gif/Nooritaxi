"use client"

import Link from "next/link"
import { NooriLogo } from "@/components/ui/noori-logo"
import { PatternOverlay } from "@/components/ui/pattern-overlay"
import { useTranslation } from "react-i18next"
export function Footer() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <footer className="relative w-full border-t bg-card overflow-hidden">
      <PatternOverlay opacity={0.03} />
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-1 lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <NooriLogo size={40} className="text-primary transition-transform group-hover:scale-110" />
              <span className="text-2xl font-bold tracking-tight text-primary">Noori</span>
            </Link>
            <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
              Building the future of mobility and logistics in Afghanistan. Safe, reliable, and community-driven.
            </p>
            <div className="flex space-x-5">
               {[
                 {
                   id: 'fb',
                   name: 'Facebook',
                   icon: (
                     <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                       <path d="M9.101 24v-11H6.149V9.63h2.952V7.467c0-2.926 1.787-4.52 4.4-4.52 1.252 0 2.328.093 2.64.135v3.06h-1.813c-1.42 0-1.695.675-1.695 1.666v2.183h3.389l-.441 3.37h-2.948V24z"/>
                     </svg>
                   ),
                   href: '#'
                 },
                 {
                   id: 'tw',
                   name: 'X (Twitter)',
                   icon: (
                     <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                       <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                     </svg>
                   ),
                   href: '#'
                 },
                 {
                   id: 'ig',
                   name: 'Instagram',
                   icon: (
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                     </svg>
                   ),
                   href: '#'
                 },
                 {
                   id: 'li',
                   name: 'LinkedIn',
                   icon: (
                     <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                       <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                     </svg>
                   ),
                   href: '#'
                 },
               ].map((social) => (
                 <a
                   key={social.id}
                   href={social.href}
                   aria-label={`Follow Noori on ${social.name}`}
                   className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer group"
                 >
                   <div className="text-primary/60 group-hover:text-primary transition-colors">
                     {social.icon}
                   </div>
                 </a>
               ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Services</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Ride Hailing</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Parcel Delivery</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Food Delivery</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Noori Pink (Women Only)</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Company</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/partners" className="text-muted-foreground hover:text-primary transition-colors">Fleet Partners</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Support</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="text-muted-foreground hover:text-primary transition-colors">Safety Center</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary/10 mt-16 pt-10 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-muted-foreground">
          <p>© 2024 Noori Mobility System. Made with ❤️ in Kabul.</p>
          <div className="flex space-x-8 mt-6 md:mt-0">
             <button onClick={() => changeLanguage('fa')} className="hover:text-primary transition-colors">Dari</button>
             <button onClick={() => changeLanguage('ps')} className="hover:text-primary transition-colors">Pashto</button>
             <button onClick={() => changeLanguage('en')} className="hover:text-primary transition-colors">English</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
