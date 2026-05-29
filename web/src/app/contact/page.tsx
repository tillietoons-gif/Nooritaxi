import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export default function ContactPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-24 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{t('contact.title', 'Contact Us')}</h1>
            <p className="text-muted-foreground">{t('contact.subtitle', "We're here to help. Send us a message and we'll respond as soon as possible.")}</p>
          </div>
          
          <form className="bg-card border shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">{t('contact.name_label', 'Name')}</label>
              <input id="name" className="w-full h-10 px-3 border rounded-md" placeholder={t('contact.name_placeholder', 'Your name')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">{t('contact.email_label', 'Email or Phone')}</label>
              <input id="email" className="w-full h-10 px-3 border rounded-md" placeholder={t('contact.email_placeholder', 'you@example.com')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">{t('contact.message_label', 'Message')}</label>
              <textarea id="message" className="w-full h-32 p-3 border rounded-md resize-none" placeholder={t('contact.message_placeholder', 'How can we help you?')} />
            </div>
            <Button className="w-full">{t('contact.send', 'Send Message')}</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
