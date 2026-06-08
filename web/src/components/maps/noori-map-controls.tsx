"use client"

import { LocateFixed, Minus, Plus } from "lucide-react"
import L from "leaflet"
import { useMap } from "react-leaflet"

type NooriMapControlsProps = {
  fitPoints?: [number, number][]
  fitPadding?: number
  className?: string
}

export function NooriMapControls({
  fitPoints = [],
  fitPadding = 0.18,
  className,
}: NooriMapControlsProps) {
  const map = useMap()
  const hasFitPoints = fitPoints.length > 0

  function handleFit() {
    if (!hasFitPoints) return
    if (fitPoints.length === 1) {
      map.setView(fitPoints[0], Math.max(map.getZoom(), 14), { animate: true })
      return
    }

    map.fitBounds(L.latLngBounds(fitPoints).pad(fitPadding), {
      animate: true,
      maxZoom: 15,
    })
  }

  return (
    <div className={className ?? "pointer-events-auto absolute right-4 top-4 z-[650] flex flex-col gap-2"}>
      <div className="overflow-hidden rounded-[1.2rem] border border-primary/15 bg-background/88 shadow-[0_18px_40px_rgba(0,33,20,0.12)] backdrop-blur-xl">
        <button
          type="button"
          aria-label="Zoom in"
          className="flex h-11 w-11 items-center justify-center border-b border-primary/10 text-primary transition-colors hover:bg-primary/10 hover:text-foreground"
          onClick={() => map.zoomIn()}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="flex h-11 w-11 items-center justify-center text-primary transition-colors hover:bg-primary/10 hover:text-foreground"
          onClick={() => map.zoomOut()}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {hasFitPoints ? (
        <button
          type="button"
          aria-label="Fit map to points"
          className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-primary/15 bg-background/88 text-primary shadow-[0_18px_40px_rgba(0,33,20,0.12)] backdrop-blur-xl transition-colors hover:bg-primary/10 hover:text-foreground"
          onClick={handleFit}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}