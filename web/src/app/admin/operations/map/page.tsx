"use client"

import { AuthGate } from "@/components/auth-gate"
import { Crosshair, Map as MapIcon, Layers, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function LiveMapCenterPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-8 md:px-8 border-b border-primary/10 bg-background/20 backdrop-blur-xl relative z-20 shadow-lg">
          <div className="mx-auto max-w-7xl">
            <AdminPageHeader
              title="Geospatial Command"
              subtitle="Tracking 3,402 online nodes in the Noori real-time grid."
              actions={
                <div className="flex gap-2">
                   <Button variant="outline" className="font-bold text-[10px] uppercase border-primary/20 bg-background/50">
                    <Layers className="h-3 w-3 mr-2" /> Layers
                  </Button>
                  <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    <Filter className="h-3 w-3 mr-2" /> Filters
                  </Button>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex-1 relative z-10 bg-muted/20 flex flex-col items-center justify-center" style={{
            backgroundImage: "radial-gradient(circle at center, rgba(var(--primary), 0.1) 0%, transparent 100%), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(var(--primary), 0.05) 40px, rgba(var(--primary), 0.05) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(var(--primary), 0.05) 40px, rgba(var(--primary), 0.05) 41px)",
            backgroundSize: "100% 100%, 40px 40px, 40px 40px"
          }}>
            <MapIcon className="h-24 w-24 text-primary/20 mb-6 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-muted-foreground">Synchronizing Fleet Mesh...</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-2">Awaiting WebGL Layer Initialization</p>
        </div>
      </main>
    </AuthGate>
  )
}
