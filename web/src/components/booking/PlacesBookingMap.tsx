"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { Compass, Route, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NooriMapControls } from "@/components/maps/noori-map-controls"

import "leaflet/dist/leaflet.css"

export type BookingPlace = {
  id: string
  name: string
  address: string
  city: string
  category?: string | null
  lat: number
  lng: number
}

type PlacesBookingMapProps = {
  places: BookingPlace[]
  pickupPlace: BookingPlace | null
  dropoffPlace: BookingPlace | null
  onSelectPickup: (place: BookingPlace) => void
  onSelectDropoff: (place: BookingPlace) => void
}

const defaultCenter: L.LatLngExpression = [34.5281, 69.1723]
const brandPrimary = "#006947"
const brandDeep = "#004d34"
const brandAccent = "#d4af37"

function createPlaceIcon(kind: "pickup" | "dropoff" | "place") {
  const color = kind === "pickup" ? brandPrimary : kind === "dropoff" ? brandAccent : brandDeep
  const textColor = kind === "dropoff" ? "#1f2937" : "#ffffff"
  const label = kind === "pickup" ? "P" : kind === "dropoff" ? "D" : ""
  const size = kind === "place" ? 24 : 34
  const halo =
    kind === "pickup"
      ? "rgba(0,105,71,0.22)"
      : kind === "dropoff"
        ? "rgba(212,175,55,0.26)"
        : "rgba(0,77,52,0.18)"

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid rgba(255,255,255,.95);box-shadow:0 0 0 6px ${halo},0 12px 22px rgba(0,33,20,.2);display:flex;align-items:center;justify-content:center;color:${textColor};font-size:12px;font-weight:900;letter-spacing:.04em;">${kind === "place" ? '<div style="width:8px;height:8px;border-radius:9999px;background:#ffffff"></div>' : label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  })
}

function FitMap({ places, pickupPlace, dropoffPlace }: Pick<PlacesBookingMapProps, "places" | "pickupPlace" | "dropoffPlace">) {
  const map = useMap()

  useEffect(() => {
    const points = [
      ...places.slice(0, 20).map((place) => [place.lat, place.lng] as [number, number]),
      ...(pickupPlace ? [[pickupPlace.lat, pickupPlace.lng] as [number, number]] : []),
      ...(dropoffPlace ? [[dropoffPlace.lat, dropoffPlace.lng] as [number, number]] : []),
    ]

    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
      return
    }

    map.fitBounds(L.latLngBounds(points).pad(0.18), { animate: true, maxZoom: 15 })
  }, [dropoffPlace, map, pickupPlace, places])

  return null
}

export default function PlacesBookingMap({
  places,
  pickupPlace,
  dropoffPlace,
  onSelectPickup,
  onSelectDropoff,
}: PlacesBookingMapProps) {
  const route = useMemo(() => {
    if (!pickupPlace || !dropoffPlace) return null
    return [
      [pickupPlace.lat, pickupPlace.lng],
      [dropoffPlace.lat, dropoffPlace.lng],
    ] as [number, number][]
  }, [dropoffPlace, pickupPlace])

  const visiblePlaces = useMemo(
    () => places.filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng)),
    [places],
  )

  const fitPoints = useMemo(
    () => [
      ...visiblePlaces.slice(0, 20).map((place) => [place.lat, place.lng] as [number, number]),
      ...(pickupPlace ? [[pickupPlace.lat, pickupPlace.lng] as [number, number]] : []),
      ...(dropoffPlace ? [[dropoffPlace.lat, dropoffPlace.lng] as [number, number]] : []),
    ],
    [dropoffPlace, pickupPlace, visiblePlaces],
  )

  const mapStateLabel = pickupPlace && dropoffPlace ? "Route staged" : pickupPlace || dropoffPlace ? "One waypoint selected" : "Browse saved places"

  return (
    <div className="noori-map-shell h-full min-h-[420px]">
      <div className="pointer-events-none absolute left-3 right-16 top-3 z-[500] max-w-[calc(100%-5.5rem)] rounded-2xl border border-primary/15 bg-background/88 px-3 py-2.5 shadow-[0_18px_40px_rgba(0,33,20,0.12)] backdrop-blur-xl sm:left-4 sm:right-auto sm:top-4 sm:max-w-xs sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary/80">
          <Sparkles className="h-3.5 w-3.5" />
          Noori Route Canvas
        </div>
        <p className="mt-1.5 text-sm font-semibold text-foreground sm:mt-2">{mapStateLabel}</p>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
          Emerald routing, gold destination cues, and saved-place pins styled to match the Noori booking flow.
        </p>
      </div>

      <MapContainer center={defaultCenter} zoom={13} zoomControl={false} className="noori-map-canvas h-full min-h-[420px] w-full">
        <FitMap places={visiblePlaces} pickupPlace={pickupPlace} dropoffPlace={dropoffPlace} />
        <NooriMapControls
          fitPoints={fitPoints}
          className="pointer-events-auto absolute right-3 top-3 z-[650] flex flex-col gap-2 sm:right-4 sm:top-4"
        />
        <TileLayer
          className="noori-map-base-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <TileLayer
          className="noori-map-label-tiles"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        />
        {route ? (
          <>
            <Polyline positions={route} pathOptions={{ color: brandAccent, weight: 9, opacity: 0.32, lineCap: "round" }} />
            <Polyline
              positions={route}
              pathOptions={{ color: brandPrimary, weight: 4.5, opacity: 0.92, dashArray: "12 10", lineCap: "round" }}
            />
          </>
        ) : null}
        {visiblePlaces.map((place) => {
          const kind = place.id === pickupPlace?.id ? "pickup" : place.id === dropoffPlace?.id ? "dropoff" : "place"
          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={createPlaceIcon(kind)}>
              <Popup>
                <div className="noori-map-popup-card">
                  <h4>{place.name}</h4>
                  <p>{place.address}</p>
                  {place.category ? <p>{place.category}</p> : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => onSelectPickup(place)}>
                      Pickup
                    </Button>
                    <Button size="sm" onClick={() => onSelectDropoff(place)}>
                      Destination
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-2xl border border-primary/15 bg-background/88 px-3 py-2.5 shadow-[0_18px_40px_rgba(0,33,20,0.12)] backdrop-blur-xl sm:bottom-4 sm:right-4 sm:px-4 sm:py-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-primary" />
          Legend
        </div>
        <div className="grid gap-1.5 text-[11px] text-foreground sm:gap-2 sm:text-xs">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Pickup</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Destination</span>
          <span className="flex items-center gap-2"><Route className="h-3.5 w-3.5 text-primary" /> Guided route</span>
        </div>
      </div>
    </div>
  )
}
