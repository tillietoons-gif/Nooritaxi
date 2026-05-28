import Link from "next/link"
import { ShieldCheck } from "lucide-react"
export function Footer() {
  return (
    <footer className="w-full border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-primary">NooriTaxi</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">Building the future of mobility and logistics in Afghanistan. Safe, reliable, and community-driven.</p>
            <div className="flex space-x-4">
               <div className="h-5 w-5 bg-muted rounded-full" />
               <div className="h-5 w-5 bg-muted rounded-full" />
               <div className="h-5 w-5 bg-muted rounded-full" />
               <div className="h-5 w-5 bg-muted rounded-full" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-primary">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Ride Hailing</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Parcel Delivery</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Food Delivery</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Women Only</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-primary">Partners</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Become a Driver</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Merchant Solutions</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Fleet Partners</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Safety Academy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-primary">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Safety Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© 2024 Noori Mobility System. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <Link href="#">Dari</Link>
             <Link href="#">Pashto</Link>
             <Link href="#">English</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
