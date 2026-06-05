"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, MapPin, Plus, RefreshCw } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

type CustomPlace = {
  id: string
  name: string
  address: string
  city: string
  category?: string | null
  aliases: string[]
  lat: number
  lng: number
  priority: number
  isActive: boolean
}

const EMPTY_FORM = {
  name: "",
  address: "",
  city: "Kabul",
  category: "",
  aliases: "",
  lat: "34.5553",
  lng: "69.2075",
  priority: "0",
}

async function responseMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => null)
  const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
  return message ? `${fallback}: ${message}` : `${fallback} (${res.status})`
}

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<CustomPlace[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authedFetch("/places/admin")
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to load places"))
      setPlaces(await res.json())
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load places")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await authedFetch("/places", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          lat: Number(form.lat),
          lng: Number(form.lng),
          priority: Number(form.priority),
          aliases: form.aliases.split(",").map((alias) => alias.trim()).filter(Boolean),
          category: form.category.trim() || null,
        }),
      })
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to create place"))
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create place")
    } finally {
      setSaving(false)
    }
  }

  async function togglePlace(place: CustomPlace) {
    setError("")
    try {
      const res = place.isActive
        ? await authedFetch(`/places/${place.id}/deactivate`, { method: "PATCH" })
        : await authedFetch(`/places/${place.id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          })
      if (!res.ok) throw new Error(await responseMessage(res, "Failed to update place"))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update place")
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Custom Places"
            subtitle="Add searchable pickup and destination places for riders."
            actions={
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive backdrop-blur-sm shadow-xl">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit border-primary/10 shadow-xl glass-premium">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Add Place</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createPlace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</Label>
                    <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Kabul University" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</Label>
                    <Input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="District 3, Kabul" required className="bg-background/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</Label>
                      <Input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Input id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="University" className="bg-background/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lat" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Latitude</Label>
                      <Input id="lat" type="number" step="0.000001" value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Longitude</Label>
                      <Input id="lng" type="number" step="0.000001" value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} required className="bg-background/50" />
                    </div>
                  </div>
                  <Button className="w-full font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Add Place"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Saved Places</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <p className="px-6 py-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Querying spatial database...</p>
                ) : places.length === 0 ? (
                  <p className="px-6 py-12 text-center text-muted-foreground">No custom places defined yet.</p>
                ) : (
                  <div className="divide-y divide-primary/5">
                    {places.map((place) => (
                      <div key={place.id} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between hover:bg-primary/5 transition-colors">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-lg tracking-tight uppercase">{place.name}</p>
                            <Badge variant={place.isActive ? "default" : "secondary"} className="text-[10px] font-black uppercase">{place.isActive ? "Active" : "Inactive"}</Badge>
                            {place.category ? <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">{place.category}</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">{place.address}</p>
                          <p className="mt-2 font-mono text-[10px] text-primary/60 font-bold uppercase tracking-widest">
                            {place.lat.toFixed(5)}, {place.lng.toFixed(5)} · {place.city}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => togglePlace(place)} className="font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary hover:text-white transition-all">
                          {place.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
