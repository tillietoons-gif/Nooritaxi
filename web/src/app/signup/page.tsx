"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Phone, User, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
import { Input } from "@/components/ui/input"
import { BodyMd, HeadingMd, LabelMd, LabelSm } from "@/components/ui/typography"
import { NooriLogo } from "@/components/ui/noori-logo"
import { apiUrl, saveSession } from "@/lib/auth"

export default function SignupPage() {
  const [name, setName] = useState("")
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
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, role: "RIDER" }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? "Registration protocol failed.")
        return
      }

      saveSession(data.access_token, data.user)
      window.location.href = "/dashboard"
    } catch {
      setMessage("Connection to registration authority timed out.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main id="main-content" className="relative min-h-screen flex items-center justify-center bg-background px-4 py-10 overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />
         </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
           <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 mb-8">
             <Zap className="h-3 w-3 text-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Enrollment Active</span>
           </div>
           <NooriLogo size={48} className="text-primary mb-6" />
           <HeadingMd className="font-black text-4xl mb-4">Join the Ecosystem</HeadingMd>
           <BodyMd className="text-lg max-w-md mx-auto">Establish your unique identifier to access world-class mobility and logistics.</BodyMd>
        </div>

        <GlassSurface variant="premium" className="p-8 md:p-16 bento-shadow border-none grid grid-cols-1 md:grid-cols-1 gap-12">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <LabelMd htmlFor="name" className="text-xs font-black">Legal Identity</LabelMd>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                  <Input
                    id="name"
                    autoComplete="name"
                    className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Full Name"
                    required
                    aria-invalid={!!message}
                    aria-describedby={message ? "signup-error" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <LabelMd htmlFor="phone" className="text-xs font-black">Communication Node</LabelMd>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+93 7XX XXX XXX"
                    required
                    aria-invalid={!!message}
                    aria-describedby={message ? "signup-error" : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <LabelMd htmlFor="password" className="text-xs font-black">Security Protocol</LabelMd>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                <Input
                  id="password"
                  autoComplete="new-password"
                  className="h-14 pl-12 pr-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  aria-invalid={!!message}
                  aria-describedby={message ? "signup-error" : "password-hint"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors focus-visible:ring-2 ring-primary/30 rounded-lg outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <LabelSm id="password-hint" className="mt-1 block">Required: Minimum 8 characters for security protocol.</LabelSm>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                By initializing this session, you agree to our 128-bit encrypted terms of service and decentralized privacy protocols.
              </p>
            </div>

            {message ? (
              <div
                id="signup-error"
                role="alert"
                className="bg-destructive/5 text-destructive p-4 rounded-xl border border-destructive/20 text-xs font-bold"
              >
                {message}
              </div>
            ) : null}

            <Button
              className="h-16 w-full rounded-2xl bg-primary hover:bg-primary/90 text-xl font-black shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Synchronizing..." : "Establish Account"}
            </Button>
          </form>

          <div className="text-center">
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
               Already connected? <Link className="text-primary hover:underline" href="/login">Return to Login</Link>
             </p>
          </div>
        </GlassSurface>
      </motion.div>
    </main>
  )
}
