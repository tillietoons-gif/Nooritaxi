"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { Car, Lock, Phone, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
import { Input } from "@/components/ui/input"
import { BodyMd, HeadingMd, LabelMd } from "@/components/ui/typography"
import { NooriLogo } from "@/components/ui/noori-logo"
import { apiUrl, getPostAuthRedirect, saveSession } from "@/lib/auth"

export default function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? "Authentication failed. Please verify your credentials.")
        return
      }

      saveSession(data.access_token, data.user)
      const next = new URLSearchParams(window.location.search).get("next")
      window.location.href = getPostAuthRedirect(data.user, next)
    } catch {
      setMessage("Unable to establish a secure connection to the command center.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-10 overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="mb-8 flex justify-between items-center px-2">
           <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm">
             <ArrowLeft className="h-4 w-4" /> Back to Terminal
           </Link>
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Channel 256-bit</span>
           </div>
        </div>

        <GlassSurface variant="premium" className="p-8 md:p-12 bento-shadow border-none">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="h-20 w-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 border border-primary/10">
              <NooriLogo size={40} className="text-primary" />
            </div>
            <HeadingMd className="mb-2 font-black">Authorized Access</HeadingMd>
            <BodyMd className="text-muted-foreground">Sign in to your Noori ecosystem</BodyMd>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <LabelMd className="text-xs font-black">Mobile Identifier</LabelMd>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                <Input
                  className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+93 7XX XXX XXX"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <LabelMd className="text-xs font-black">Security Credential</LabelMd>
                <Link href="#" className="text-[10px] font-black uppercase text-primary/60 hover:text-primary transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                <Input
                  className="h-14 pl-12 pr-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {message ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-destructive/5 text-destructive p-4 rounded-xl border border-destructive/20 text-xs font-bold"
              >
                {message}
              </motion.div>
            ) : null}

            <Button
              className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : "Initialize Access"}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-border/50 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              New Fleet Member? <Link className="text-primary hover:underline" href="/signup">Establish Account</Link>
            </p>
          </div>
        </GlassSurface>

        <div className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          © 2024 NOORI MOBILITY SYSTEMS • KABUL • GLOBAL
        </div>
      </motion.div>
    </main>
  )
}
