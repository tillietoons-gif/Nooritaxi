import Link from "next/link"
import { NooriLogo } from "@/components/ui/noori-logo"
import { PatternOverlay } from "@/components/ui/pattern-overlay"

export function Footer() {
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
               {['fb', 'tw', 'ig', 'li'].map((social) => (
                 <div key={social} className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer group">
                   <div className="h-5 w-5 bg-primary/20 rounded-sm group-hover:bg-primary/40 transition-colors" />
                 </div>
               ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Services</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Ride Hailing</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Parcel Delivery</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Food Delivery</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Noori Pink (Women Only)</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Partners</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Become a Driver</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Merchant Solutions</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Fleet Partners</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Safety Academy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm">Support</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Safety Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary/10 mt-16 pt-10 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-muted-foreground">
          <p>© 2024 Noori Mobility System. Made with ❤️ in Kabul.</p>
          <div className="flex space-x-8 mt-6 md:mt-0">
             <Link href="#" className="hover:text-primary transition-colors">Dari</Link>
             <Link href="#" className="hover:text-primary transition-colors">Pashto</Link>
             <Link href="#" className="hover:text-primary transition-colors">English</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
