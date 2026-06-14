"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthGate } from "@/components/auth-gate"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, Plus, Power } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

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
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <AdminPageHeader
            title={t('surge.title')}
            subtitle={t('surge.description')}
          />

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
            <Card className="h-fit border-primary/10 shadow-xl glass-premium">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tight">{t('surge.create')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createZone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('surge.zone_name')}</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Downtown Rush" required className="bg-background/50" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="multiplier" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('surge.multiplier')}</Label>
                      <Input id="multiplier" type="number" step="0.1" min="1.1" max="5.0" value={multiplier} onChange={e => setMultiplier(e.target.value)} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="radius" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('surge.radius')}</Label>
                      <Input id="radius" type="number" step="0.5" min="0.5" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} required className="bg-background/50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('surge.duration')}</Label>
                    <Input id="hours" type="number" min="1" max="24" value={hoursActive} onChange={e => setHoursActive(e.target.value)} required className="bg-background/50" />
                  </div>

                  <Button type="submit" className="w-full font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading || !name}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('surge.deploy')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight">{t('surge.active_zones')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loading && zones.length === 0 ? (
                  <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs py-10 text-center">{t('surge.loading')}</p>
                ) : zones.length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center">{t('surge.no_zones')}</p>
                ) : (
                  <div className="space-y-3">
                    {zones.map((zone) => {
                      const isCurrentlyActive = zone.isCurrentlyActive ?? (zone.isActive && new Date(zone.activeUntil) > new Date())
                      return (
                        <div key={zone.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCurrentlyActive ? 'border-primary/30 bg-primary/10 shadow-lg' : 'bg-muted/30 opacity-70'}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-sm uppercase tracking-tight">{zone.name}</p>
                              {isCurrentlyActive ? (
                                <Badge className="bg-primary hover:bg-primary text-[10px] font-black uppercase">{t('surge.active')}</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">{t('surge.inactive')}</Badge>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {t('surge.multiplier_label', { mult: zone.multiplier, rad: zone.radiusKm?.toFixed(1) ?? "n/a" })}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {t('surge.until', { date: new Date(zone.activeUntil).toLocaleString() })}
                            </p>
                          </div>
                          
                          <Button 
                            variant={isCurrentlyActive ? "destructive" : "secondary"} 
                            size="sm"
                            className="font-black uppercase tracking-widest text-[10px]"
                            onClick={() => toggleZone(zone.id, isCurrentlyActive)}
                          >
                            <Power className="mr-2 h-3 w-3" />
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
