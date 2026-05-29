import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Store, Car, ArrowRight } from "lucide-react"

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Grow Your Business with <span className="text-primary">Noori</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join thousands of merchants and drivers who are earning more every day with Noori.
            </p>
          </div>
        </section>

        <section className="py-24 px-4 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-8 border rounded-3xl bg-card shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Restaurants & Stores</h2>
              <p className="text-muted-foreground mb-8">Reach more customers and grow your revenue. We handle the delivery so you can focus on making great food and products.</p>
              <button className="flex items-center gap-2 font-bold text-primary hover:underline mt-auto">
                Become a Merchant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 border rounded-3xl bg-card shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Car className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Drivers & Riders</h2>
              <p className="text-muted-foreground mb-8">Be your own boss. Drive when you want, where you want, and earn competitive rates with daily payouts.</p>
              <button className="flex items-center gap-2 font-bold text-primary hover:underline mt-auto">
                Sign Up to Drive <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
