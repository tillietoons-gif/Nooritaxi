import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShieldCheck, Eye, Phone, MapPin } from "lucide-react"

export default function SafetyPage() {
  const features = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Driver Verification",
      description: "Every driver undergoes comprehensive background checks and identity verification before joining our platform.",
    },
    {
      icon: <Eye className="h-10 w-10 text-primary" />,
      title: "Real-time Tracking",
      description: "Follow your ride or delivery in real-time. Share your journey with trusted contacts for added peace of mind.",
    },
    {
      icon: <Phone className="h-10 w-10 text-primary" />,
      title: "In-App SOS Button",
      description: "Emergency assistance is just a tap away. Our 24/7 support team and local authorities are instantly notified.",
    },
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: "Safe Zones",
      description: "Our system monitors rides constantly. Any unexpected deviations from the route trigger automatic check-ins.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Your Safety is Our <span className="text-primary">Top Priority</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              At Noori, we've built our platform from the ground up with your security in mind. 
              Discover the features that make every journey safe.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {features.map((f, i) => (
              <div key={i} className="flex gap-6 p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
