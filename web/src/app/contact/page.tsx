import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeadingLg } from "@/components/ui/typography"
export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-24 text-center"><HeadingLg>Get in Touch</HeadingLg></main>
      <Footer />
    </div>
  )
}
