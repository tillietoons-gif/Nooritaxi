"use client"

import Link from "next/link"
import { useState } from "react"
import { Car, Lock, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BodyMd } from "@/components/ui/typography"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export default function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
        setMessage(data.message ?? "Login failed")
        return
      }

      window.localStorage.setItem("noori_token", data.access_token)
      window.location.href = "/dashboard"
    } catch {
      setMessage("Unable to reach the server")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Car className="h-6 w-6" />
            <span className="font-bold">NooriTaxi</span>
          </div>
          <CardTitle>Log in</CardTitle>
          <BodyMd className="text-muted-foreground">Access your Noori account.</BodyMd>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Phone</span>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-11 pl-9" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+93 7xx xxx xxx" required />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-11 pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </label>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button className="h-11 w-full" type="submit" disabled={isLoading}>{isLoading ? "Logging in..." : "Log In"}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New to Noori? <Link className="font-medium text-primary" href="/signup">Create account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
