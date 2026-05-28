import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { HeadingLg, BodyLg } from "@/components/ui/typography"
export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1"><section className="bg-primary py-24 text-white text-center"><HeadingLg className="text-5xl">Grow Your Business with Noori</HeadingLg><BodyLg className="text-primary-foreground/80 mt-4">Join Afghanistan&apos;s leading mobility network.</BodyLg><Button variant="secondary" size="xl" className="mt-8">Get Started</Button></section></main>
      <Footer />
    </div>
  )
}
