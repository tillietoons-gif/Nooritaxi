"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { Button } from "@/components/ui/button"

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

function createPlaceIcon(kind: "pickup" | "dropoff" | "place") {
  const color = kind === "pickup" ? "#16a34a" : kind === "dropoff" ? "#2563eb" : "#f97316"
  const label = kind === "pickup" ? "P" : kind === "dropoff" ? "D" : ""
  const size = kind === "place" ? 24 : 30

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.24);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;">${label}</div>`,
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

  return (
    <MapContainer center={defaultCenter} zoom={13} className="h-full min-h-[420px] w-full">
      <FitMap places={visiblePlaces} pickupPlace={pickupPlace} dropoffPlace={dropoffPlace} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {route ? <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75 }} /> : null}
      {visiblePlaces.map((place) => {
        const kind = place.id === pickupPlace?.id ? "pickup" : place.id === dropoffPlace?.id ? "dropoff" : "place"
        return (
          <Marker key={place.id} position={[place.lat, place.lng]} icon={createPlaceIcon(kind)}>
            <Popup>
              <div className="min-w-48 space-y-2">
                <div>
                  <p className="font-semibold">{place.name}</p>
                  <p className="text-xs text-muted-foreground">{place.address}</p>
                  {place.category ? <p className="text-xs text-muted-foreground">{place.category}</p> : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
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
  )
}
