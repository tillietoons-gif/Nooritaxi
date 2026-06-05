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
      <main className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <MapPin className="h-6 w-6 text-primary" />
                Custom Places
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Add searchable pickup and destination places for riders.
              </p>
            </div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Add Place</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createPlace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Kabul University" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="District 3, Kabul" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="University" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input id="lat" type="number" step="0.000001" value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input id="lng" type="number" step="0.000001" value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_96px] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="aliases">Aliases</Label>
                      <Input id="aliases" value={form.aliases} onChange={(event) => setForm({ ...form, aliases: event.target.value })} placeholder="KU, پوهنتون کابل" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Input id="priority" type="number" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full" disabled={saving}>
                    <Plus className="h-4 w-4" />
                    {saving ? "Saving..." : "Add Place"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Places</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading places...</p>
                ) : places.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No custom places yet.</p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {places.map((place) => (
                      <div key={place.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{place.name}</p>
                            <Badge variant={place.isActive ? "default" : "secondary"}>{place.isActive ? "Active" : "Inactive"}</Badge>
                            {place.category ? <Badge variant="outline">{place.category}</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{place.address}</p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {place.lat.toFixed(5)}, {place.lng.toFixed(5)} · {place.city}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => togglePlace(place)}>
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
