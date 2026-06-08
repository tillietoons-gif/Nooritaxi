"use client"

import dynamic from "next/dynamic"
import { AuthGate } from "@/components/auth-gate"
import { Crosshair, Layers, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

const LiveMap = dynamic(() => import("@/components/admin/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[640px] items-center justify-center bg-muted/30 text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
})

export default function LiveMapCenterPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <AdminPageHeader
              title="Geospatial Command"
              subtitle="The Noori command map, re-skinned for the admin design system and tuned for live fleet operations."
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" className="border-primary/20 bg-background/50 font-bold text-[10px] uppercase">
                    <Layers className="h-3 w-3 mr-2" /> Layers
                  </Button>
                  <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    <Filter className="h-3 w-3 mr-2" /> Filters
                  </Button>
                </div>
              }
            />

          <div className="relative z-10 min-h-[640px] overflow-hidden rounded-[1.75rem] border border-primary/15 bg-background/70 shadow-[0_24px_55px_rgba(0,33,20,0.12)]">
            <LiveMap />
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
