import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeadingLg } from "@/components/ui/typography"
export default function SafetyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-24 text-center"><HeadingLg>Your Safety is Our Top Priority</HeadingLg></main>
      <Footer />
    </div>
  )
}
