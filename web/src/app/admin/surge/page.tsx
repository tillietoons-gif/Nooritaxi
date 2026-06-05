"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { AuthGate } from "@/components/auth-gate"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, Plus, Power, Activity } from "lucide-react"
import { useTranslation } from "react-i18next"

type SurgeZone = {
  id: string
  name: string
  multiplier: number
  isActive: boolean
  isCurrentlyActive?: boolean
  activeFrom: string
  activeUntil: string
  centerLat: number | null
  centerLng: number | null
  radiusKm: number | null
}

export default function SurgePage() {
  const { t } = useTranslation()
  const [zones, setZones] = useState<SurgeZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // New zone form
  const [name, setName] = useState("")
  const [multiplier, setMultiplier] = useState("1.5")
  const [radiusKm, setRadiusKm] = useState("5")
  const [hoursActive, setHoursActive] = useState("2")

  async function getErrorMessage(res: Response, fallback: string) {
    try {
      const body = await res.json()
      const message = Array.isArray(body.message) ? body.message.join(", ") : body.message
      return message ? `${fallback}: ${message}` : `${fallback} (${res.status})`
    } catch {
      return `${fallback} (${res.status})`
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authedFetch("/surge-zones")
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load surge zones"))
      setZones(await res.json())
      setError("")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createZone(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const activeFrom = new Date()
      const activeUntil = new Date()
      activeUntil.setHours(activeUntil.getHours() + Number(hoursActive))

      const res = await authedFetch("/surge-zones", {
        method: "POST",
        body: JSON.stringify({
          name,
          multiplier: Number(multiplier),
          radiusKm: Number(radiusKm),
          centerLat: 34.5553, // Kabul center for demo
          centerLng: 69.2075,
          isActive: true,
          activeFrom: activeFrom.toISOString(),
          activeUntil: activeUntil.toISOString(),
        })
      })

      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create zone"))
      
      setName("")
      setError("")
      await load()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  async function toggleZone(id: string, currentlyActive: boolean) {
    setLoading(true)
    try {
      let res: Response
      if (currentlyActive) {
        res = await authedFetch(`/surge-zones/${id}/deactivate`, { method: "PATCH" })
      } else {
        res = await authedFetch(`/surge-zones/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            isActive: true,
            activeUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          })
        })
      }
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update surge zone"))
      setError("")
      await load()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <HeadingMd className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              {t('surge.title')}
            </HeadingMd>
            <BodyMd className="text-muted-foreground mt-1">
              {t('surge.description')}
            </BodyMd>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{t('surge.create')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createZone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('surge.zone_name')}</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Downtown Rush" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="multiplier">{t('surge.multiplier')}</Label>
                      <Input id="multiplier" type="number" step="0.1" min="1.1" max="5.0" value={multiplier} onChange={e => setMultiplier(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="radius">{t('surge.radius')}</Label>
                      <Input id="radius" type="number" step="0.5" min="0.5" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">{t('surge.duration')}</Label>
                    <Input id="hours" type="number" min="1" max="24" value={hoursActive} onChange={e => setHoursActive(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !name}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('surge.deploy')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('surge.active_zones')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && zones.length === 0 ? (
                  <p className="text-muted-foreground">{t('surge.loading')}</p>
                ) : zones.length === 0 ? (
                  <p className="text-muted-foreground">{t('surge.no_zones')}</p>
                ) : (
                  <div className="space-y-3">
                    {zones.map((zone) => {
                      const isCurrentlyActive = zone.isCurrentlyActive ?? (zone.isActive && new Date(zone.activeUntil) > new Date())
                      return (
                        <div key={zone.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCurrentlyActive ? 'border-primary bg-primary/5' : 'bg-muted/30 opacity-70'}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold">{zone.name}</p>
                              {isCurrentlyActive ? (
                                <Badge className="bg-primary hover:bg-primary">{t('surge.active')}</Badge>
                              ) : (
                                <Badge variant="secondary">{t('surge.inactive')}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t('surge.multiplier_label', { mult: zone.multiplier, rad: zone.radiusKm?.toFixed(1) ?? "n/a" })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('surge.until', { date: new Date(zone.activeUntil).toLocaleString() })}
                            </p>
                          </div>
                          
                          <Button 
                            variant={isCurrentlyActive ? "destructive" : "secondary"} 
                            size="sm"
                            onClick={() => toggleZone(zone.id, isCurrentlyActive)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {isCurrentlyActive ? t('surge.deactivate') : t('surge.reactivate')}
                          </Button>
                        </div>
                      )
                    })}
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
