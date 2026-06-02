"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg } from "@/components/ui/typography"
import { Crosshair, Map as MapIcon, Layers, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LiveMapPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col h-screen bg-background/50 overflow-hidden">
        <Header />
        
        <div className="flex-1 flex flex-col relative">
          {/* Top Control Bar overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="glass-premium p-4 rounded-2xl pointer-events-auto">
              <HeadingLg className="mb-1 flex items-center gap-2">
                <Crosshair className="h-6 w-6 text-primary" /> Live Map Center
              </HeadingLg>
              <p className="text-xs text-muted-foreground">Tracking 3,402 online drivers in real-time</p>
            </div>
            
            <div className="flex flex-col gap-2 pointer-events-auto">
              <Button variant="outline" className="glass-premium border-primary/20 bg-background/80 justify-start w-40">
                <Layers className="h-4 w-4 mr-2" /> Heatmap
              </Button>
              <Button variant="outline" className="glass-premium border-primary/20 bg-background/80 justify-start w-40">
                <MapIcon className="h-4 w-4 mr-2" /> Clusters
              </Button>
              <Button variant="outline" className="glass-premium border-primary/20 bg-background/80 justify-start w-40">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </div>
          </div>

          {/* Placeholder for Mapbox/Google Maps integration */}
          <div className="flex-1 bg-muted/20 flex flex-col items-center justify-center border-t border-primary/10" style={{
            backgroundImage: "radial-gradient(circle at center, rgba(var(--primary), 0.1) 0%, transparent 100%), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(var(--primary), 0.05) 40px, rgba(var(--primary), 0.05) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(var(--primary), 0.05) 40px, rgba(var(--primary), 0.05) 41px)",
            backgroundSize: "100% 100%, 40px 40px, 40px 40px"
          }}>
            <MapIcon className="h-32 w-32 text-primary/20 mb-4 animate-pulse" />
            <h2 className="text-2xl font-black text-muted-foreground">Geospatial Engine Connecting...</h2>
            <p className="text-sm text-muted-foreground mt-2">Waiting for Mapbox GL JS / WebGL Context</p>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
