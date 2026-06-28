"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Phone, User, Eye, EyeOff, ShieldCheck, Zap, Check, Car, Store, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
import { Input } from "@/components/ui/input"
import { BodyMd, HeadingMd, LabelMd, LabelSm } from "@/components/ui/typography"
import { NooriLogo } from "@/components/ui/noori-logo"
import { type AuthUser, apiUrl, saveSession } from "@/lib/auth"
import { cn } from "@/lib/utils"

type SignupRole = "RIDER" | "DRIVER" | "MERCHANT"
type MessageTone = "error" | "success"
type PendingSession = {
  access_token: string
  user: AuthUser
}

const signupRoles: Array<{
  value: SignupRole
  icon: LucideIcon
}> = [
  { value: "RIDER", icon: User },
  { value: "DRIVER", icon: Car },
  { value: "MERCHANT", icon: Store },
]

export default function SignupPage() {
  const { t } = useTranslation()
  const [role, setRole] = useState<SignupRole>("RIDER")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantAddress, setRestaurantAddress] = useState("")
  const [restaurantPhone, setRestaurantPhone] = useState("")
  const [cuisineTypes, setCuisineTypes] = useState("")
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState("")
  const [ownerIdUrl, setOwnerIdUrl] = useState("")
  const [payoutContact, setPayoutContact] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null)
  const [message, setMessage] = useState("")
  const [messageTone, setMessageTone] = useState<MessageTone>("error")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage("")
    setMessageTone("error")

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, role }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? "Registration protocol failed.")
        return
      }

      await fetch(`${apiUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      setPendingSession(data)
      setMessageTone("success")
      setMessage(t("signup.code_sent", "Account created. Enter the verification code sent to your phone."))
    } catch {
      setMessage("Connection to registration authority timed out.")
    } finally {
      setIsLoading(false)
    }
  }

  async function verifyAndContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingSession) return

    setIsLoading(true)
    setMessage("")
    setMessageTone("error")

    try {
      const verifyResponse = await fetch(`${apiUrl}/auth/verify-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      })
      const verifyData = await verifyResponse.json().catch(() => null)

      if (!verifyResponse.ok) {
        setMessage(verifyData?.message ?? t("signup.invalid_code", "Invalid or expired verification code."))
        return
      }

      if (role === "DRIVER") {
        setMessageTone("success")
        setMessage(t("signup.driver_verified", "Phone verified. Continue in the Noori Driver mobile app to complete KYC."))
        return
      }

      if (role === "MERCHANT") {
        const restaurantResponse = await fetch(`${apiUrl}/food/restaurants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pendingSession.access_token}`,
          },
          body: JSON.stringify({
            name: restaurantName,
            address: restaurantAddress,
            phone: restaurantPhone || phone,
            cuisineTypes: cuisineTypes
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        })

        if (!restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json().catch(() => null)
          setMessage(restaurantData?.message ?? t("signup.store_failed", "Merchant account created, but store setup failed."))
          return
        }
        const restaurant = await restaurantResponse.json()
        const merchantDocuments = [
          businessLicenseUrl.trim()
            ? { type: "BUSINESS_LICENSE", url: businessLicenseUrl.trim(), notes: "Business license submitted during web signup" }
            : null,
          ownerIdUrl.trim()
            ? { type: "OWNER_ID", url: ownerIdUrl.trim(), notes: "Owner ID submitted during web signup" }
            : null,
          payoutContact.trim()
            ? { type: "PAYOUT_CONTACT", url: `tel:${payoutContact.trim()}`, notes: "Payout contact submitted during web signup" }
            : null,
        ].filter(Boolean)

        await Promise.all(
          merchantDocuments.map((document) =>
            fetch(`${apiUrl}/food/restaurants/${restaurant.id}/documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${pendingSession.access_token}`,
              },
              body: JSON.stringify(document),
            })
          )
        )
      }

      const meResponse = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${pendingSession.access_token}` },
      })
      const me = await meResponse.json().catch(() => null)
      saveSession(pendingSession.access_token, me?.user ?? pendingSession.user)
      window.location.href = "/dashboard"
    } catch {
      setMessage(t("signup.verify_timeout", "Connection to verification authority timed out."))
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
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t("signup.badge", "Priority Enrollment Active")}</span>
           </div>
           <NooriLogo size={48} className="text-primary mb-6" />
           <HeadingMd className="font-black text-4xl mb-4">{t("signup.title", "Join the Ecosystem")}</HeadingMd>
           <BodyMd className="text-lg max-w-md mx-auto">{t("signup.subtitle", "Establish your unique identifier to access world-class mobility and logistics.")}</BodyMd>
        </div>

        <GlassSurface variant="premium" className="p-8 md:p-16 bento-shadow border-none grid grid-cols-1 md:grid-cols-1 gap-12">
          <form onSubmit={pendingSession ? verifyAndContinue : submit} className="space-y-6">
            {pendingSession ? (
              <div className="space-y-3">
                <LabelMd htmlFor="otpCode" className="text-xs font-black">{t("signup.phone_verification", "Phone Verification")}</LabelMd>
                <Input
                  id="otpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-14 rounded-2xl glass border-none text-center text-xl font-black tracking-[0.4em] focus-visible:ring-primary/30"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="000000"
                  minLength={6}
                  maxLength={6}
                  required
                  aria-invalid={!!message && messageTone === "error"}
                  aria-describedby={message ? "signup-message" : undefined}
                />
                <LabelSm className="text-muted-foreground">
                  {t("signup.code_help", "We sent a 6-digit code to {{phone}}. Verify it to finish onboarding.", { phone })}
                </LabelSm>
              </div>
            ) : (
              <>
            <div className="space-y-3">
              <span id="role-selection-label" className="sr-only">
                {t("signup.role_selection_label", "Select your role in the ecosystem")}
              </span>
              <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="role-selection-label">
                {signupRoles.map((option) => {
                  const Icon = option.icon
                  const isSelected = role === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={cn(
                        "flex h-16 items-center justify-center gap-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "border-primary/10 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                      aria-pressed={isSelected}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t(`signup.roles.${option.value.toLowerCase()}`, option.value)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <LabelMd htmlFor="name" className="text-xs font-black">{t("signup.name_label", "Legal Identity")}</LabelMd>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="name"
                    autoComplete="name"
                    className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("signup.name_placeholder", "Full Name")}
                    required
                    aria-invalid={!!message}
                    aria-describedby={message ? "signup-message" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <LabelMd htmlFor="phone" className="text-xs font-black">{t("signup.phone_label", "Communication Node")}</LabelMd>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary" />
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
                    aria-describedby={message ? "signup-message" : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <LabelMd htmlFor="password" className="text-xs font-black">{t("signup.password_label", "Security Protocol")}</LabelMd>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  autoComplete="new-password"
                  className="h-14 pl-12 pr-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("signup.password_placeholder", "Min. 8 characters")}
                  minLength={8}
                  required
                  aria-invalid={!!message}
                  aria-describedby={message ? "signup-message" : "password-hint"}
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
              <LabelSm
                id="password-hint"
                className={cn(
                  "mt-1 flex items-center gap-1.5 transition-colors duration-300",
                  password.length >= 8 ? "text-primary font-black" : ""
                )}
              >
                {password.length >= 8 && <Check className="h-3 w-3" />}
                {t("signup.password_hint", "Required: Minimum 8 characters for security protocol.")}
              </LabelSm>
            </div>

            {role === "MERCHANT" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <LabelMd htmlFor="restaurantName" className="text-xs font-black">{t("signup.store_name", "Store Name")}</LabelMd>
                  <div className="relative group">
                    <Store className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary" />
                    <Input
                      id="restaurantName"
                      className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                      value={restaurantName}
                      onChange={(event) => setRestaurantName(event.target.value)}
                      placeholder={t("signup.store_name_placeholder", "Restaurant or shop")}
                      required={role === "MERCHANT"}
                      aria-invalid={!!message && role === "MERCHANT"}
                      aria-describedby={message ? "signup-message" : undefined}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelMd htmlFor="restaurantPhone" className="text-xs font-black">{t("signup.store_phone", "Store Phone")}</LabelMd>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary" />
                    <Input
                      id="restaurantPhone"
                      type="tel"
                      autoComplete="tel"
                      className="h-14 pl-12 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                      value={restaurantPhone}
                      onChange={(event) => setRestaurantPhone(event.target.value)}
                      placeholder={t("signup.store_phone_placeholder", "Defaults to account phone")}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <LabelMd htmlFor="restaurantAddress" className="text-xs font-black">{t("signup.store_address", "Store Address")}</LabelMd>
                  <Input
                    id="restaurantAddress"
                    className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={restaurantAddress}
                    onChange={(event) => setRestaurantAddress(event.target.value)}
                    placeholder={t("signup.store_address_placeholder", "Street, district, city")}
                    required={role === "MERCHANT"}
                    aria-invalid={!!message && role === "MERCHANT"}
                    aria-describedby={message ? "signup-message" : undefined}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <LabelMd htmlFor="cuisineTypes" className="text-xs font-black">{t("signup.categories", "Categories")}</LabelMd>
                  <Input
                    id="cuisineTypes"
                    className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={cuisineTypes}
                    onChange={(event) => setCuisineTypes(event.target.value)}
                    placeholder={t("signup.categories_placeholder", "Afghan, grill, bakery")}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <LabelMd htmlFor="businessLicenseUrl" className="text-xs font-black">{t("signup.business_license", "Business License URL")}</LabelMd>
                  <Input
                    id="businessLicenseUrl"
                    className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={businessLicenseUrl}
                    onChange={(event) => setBusinessLicenseUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <LabelMd htmlFor="ownerIdUrl" className="text-xs font-black">{t("signup.owner_id", "Owner ID URL")}</LabelMd>
                  <Input
                    id="ownerIdUrl"
                    className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={ownerIdUrl}
                    onChange={(event) => setOwnerIdUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <LabelMd htmlFor="payoutContact" className="text-xs font-black">{t("signup.payout_contact", "Payout Contact")}</LabelMd>
                  <Input
                    id="payoutContact"
                    type="tel"
                    className="h-14 rounded-2xl glass border-none focus-visible:ring-primary/30 font-bold"
                    value={payoutContact}
                    onChange={(event) => setPayoutContact(event.target.value)}
                    placeholder="+93 7XX XXX XXX"
                  />
                </div>
              </div>
            )}
              </>
            )}

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                {t("signup.terms_notice", "By initializing this session, you agree to our encrypted terms of service and privacy protocols.")}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key="signup-message"
                  id="signup-message"
                  role="alert"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className={cn(
                    "p-4 rounded-xl border text-xs font-bold overflow-hidden",
                    messageTone === "success"
                      ? "bg-primary/5 text-primary border-primary/20"
                      : "bg-destructive/5 text-destructive border-destructive/20"
                  )}
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              className="h-16 w-full rounded-2xl bg-primary hover:bg-primary/90 text-xl font-black shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synchronizing...
                </div>
              ) : pendingSession ? t("signup.verify_continue", "Verify & Continue") : t("signup.establish", "Establish Account")}
            </Button>
          </form>

          <div className="text-center">
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
               {t("signup.already_connected", "Already connected?")} <Link className="text-primary hover:underline" href="/login">{t("signup.return_login", "Return to Login")}</Link>
             </p>
          </div>
        </GlassSurface>
      </motion.div>
    </main>
  )
}
