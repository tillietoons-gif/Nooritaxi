"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { io, Socket } from "socket.io-client";
import { Crosshair, Layers, LocateFixed, MapPin, Radio, RefreshCw, Search, Users, Wifi, WifiOff, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NooriMapControls } from "@/components/maps/noori-map-controls";
import { apiUrl, getToken } from "@/lib/auth";

import "leaflet/dist/leaflet.css";

const BRAND_PRIMARY = "#006947";
const BRAND_DEEP = "#004d34";
const BRAND_ACCENT = "#d4af37";

interface DriverLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status?: string;
}

interface SurgeZone {
  id: string;
  name: string;
  multiplier: number;
  isActive: boolean;
  isCurrentlyActive?: boolean;
  activeUntil: string;
  polygon?: {
    type?: string;
    coordinates?: number[][][];
  };
}

interface CustomPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  category?: string | null;
  lat: number;
  lng: number;
  priority: number;
  isActive: boolean;
}

type ViewportControllerProps = {
  drivers: DriverLocation[];
  surgeZones: SurgeZone[];
  places: CustomPlace[];
  fitVersion: number;
  selectedDriver?: DriverLocation;
};

const mapCenter: L.LatLngExpression = [34.5281, 69.1723];

function getStatusColor(status?: string) {
  return status === "BUSY" ? BRAND_ACCENT : BRAND_PRIMARY;
}

function getStatusLabel(status?: string) {
  return status === "BUSY" ? "Busy" : "Online";
}

function createDriverIcon(status: string | undefined, selected = false, driverName?: string) {
  const color = getStatusColor(status);
  const size = selected ? 38 : 30;
  const label = driverName?.trim().charAt(0).toUpperCase() || "D";
  const textColor = status === "BUSY" ? "#1f2937" : "#ffffff";
  const ring = selected
    ? `0 0 0 8px rgba(212, 175, 55, 0.22), 0 18px 34px rgba(0, 33, 20, 0.24)`
    : `0 0 0 6px ${status === "BUSY" ? "rgba(212,175,55,0.2)" : "rgba(0,105,71,0.18)"}, 0 12px 24px rgba(0, 33, 20, 0.2)`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid rgba(255,255,255,.96);box-shadow:${ring};display:flex;align-items:center;justify-content:center;color:${textColor};font-size:13px;font-weight:900;letter-spacing:.04em;">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function createPlaceIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${BRAND_DEEP};border:3px solid rgba(255,255,255,.96);box-shadow:0 0 0 6px rgba(0,77,52,0.15),0 12px 24px rgba(0,33,20,.2);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:9999px;background:${BRAND_ACCENT};"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function formatTime(date: Date | null) {
  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-";
}

function getSurgeZoneRing(zone: SurgeZone): [number, number][] {
  const ring = zone.polygon?.type === "Polygon" ? zone.polygon.coordinates?.[0] : null;
  if (!ring?.length) return [];
  return ring
    .filter(([lng, lat]) => Number.isFinite(lat) && Number.isFinite(lng))
    .map(([lng, lat]) => [lat, lng]);
}

function getZonePathOptions(zone: SurgeZone) {
  const active = zone.isCurrentlyActive ?? zone.isActive;
  return {
    color: active ? BRAND_ACCENT : BRAND_PRIMARY,
    fillColor: active ? BRAND_ACCENT : BRAND_PRIMARY,
    fillOpacity: active ? 0.24 : 0.09,
    opacity: active ? 0.95 : 0.52,
    weight: active ? 3 : 2,
  };
}

function ViewportController({ drivers, surgeZones, places, fitVersion, selectedDriver }: ViewportControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedDriver) return;
    map.setView([selectedDriver.lat, selectedDriver.lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [map, selectedDriver]);

  useEffect(() => {
    if (selectedDriver) return;
    const zonePoints = surgeZones.flatMap((zone) => getSurgeZoneRing(zone));
    const placePoints = places.map((place) => [place.lat, place.lng] as [number, number]);
    const points = [
      ...drivers.map((driver) => [driver.lat, driver.lng] as [number, number]),
      ...zonePoints,
      ...placePoints,
    ];
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: true, maxZoom: 15 });
  }, [drivers, surgeZones, places, fitVersion, map, selectedDriver]);

  return null;
}

export default function LiveMap() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);
  const [places, setPlaces] = useState<CustomPlace[]>([]);
  const [activeModal, setActiveModal] = useState<"drivers" | "places" | "zones" | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [visibleLayers, setVisibleLayers] = useState({
    drivers: true,
    zones: true,
    places: true,
  });
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [fitVersion, setFitVersion] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId),
    [drivers, selectedDriverId],
  );

  const totals = useMemo(
    () => ({
      online: drivers.filter((driver) => driver.status !== "BUSY").length,
      busy: drivers.filter((driver) => driver.status === "BUSY").length,
      activeSurgeZones: surgeZones.filter((zone) => zone.isCurrentlyActive ?? zone.isActive).length,
      places: places.length,
    }),
    [drivers, surgeZones, places],
  );

  const visibleDrivers = visibleLayers.drivers ? drivers : [];
  const visibleZones = visibleLayers.zones ? surgeZones : [];
  const visiblePlaces = visibleLayers.places ? places : [];
  const fitPoints = useMemo(
    () => [
      ...visibleDrivers.map((driver) => [driver.lat, driver.lng] as [number, number]),
      ...visibleZones.flatMap((zone) => getSurgeZoneRing(zone)),
      ...visiblePlaces.map((place) => [place.lat, place.lng] as [number, number]),
    ],
    [visibleDrivers, visiblePlaces, visibleZones],
  );
  const normalizedSearch = modalSearch.trim().toLowerCase();
  const filteredDrivers = drivers.filter((driver) =>
    [driver.name, driver.id, driver.status].some((value) => value?.toLowerCase().includes(normalizedSearch)),
  );
  const filteredPlaces = places.filter((place) =>
    [place.name, place.address, place.city, place.category ?? ""].some((value) => value.toLowerCase().includes(normalizedSearch)),
  );
  const filteredZones = surgeZones.filter((zone) =>
    [zone.name, String(zone.multiplier), (zone.isCurrentlyActive ?? zone.isActive) ? "active" : "inactive"].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
  const modalTitle = activeModal === "drivers" ? "Drivers" : activeModal === "places" ? "Custom Places" : "Surge Zones";
  const modalDescription =
    activeModal === "drivers"
      ? "Search online and busy drivers on the live map."
      : activeModal === "places"
        ? "Search saved rider pickup and destination places."
        : "Search configured surge overlays.";
  const modalPlaceholder =
    activeModal === "drivers"
      ? "Search by driver, status, or ID"
      : activeModal === "places"
        ? "Search by place, address, city, or category"
        : "Search by zone, status, or multiplier";

  function toggleLayer(layer: keyof typeof visibleLayers) {
    setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function openModal(modal: "drivers" | "places" | "zones") {
    setActiveModal(modal);
    setModalSearch("");
  }

  const loadDrivers = useCallback(async (silent = false) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("You must be logged in to view live driver tracking.");
      }

      if (!silent) setIsLoading(true);
      setIsRefreshing(true);

      const headers = { Authorization: `Bearer ${token}` };
      const [driversResponse, surgeResponse, placesResponse] = await Promise.all([
        fetch(`${apiUrl}/admin-tracking/online-drivers`, { headers }),
        fetch(`${apiUrl}/surge-zones`, { headers }),
        fetch(`${apiUrl}/places?limit=25`, { headers }),
      ]);

      if (!driversResponse.ok) {
        throw new Error(`Failed to fetch driver data (${driversResponse.status}).`);
      }
      if (!surgeResponse.ok) {
        throw new Error(`Failed to fetch surge zones (${surgeResponse.status}).`);
      }
      if (!placesResponse.ok) {
        throw new Error(`Failed to fetch custom places (${placesResponse.status}).`);
      }

      const data: DriverLocation[] = await driversResponse.json();
      const zones: SurgeZone[] = await surgeResponse.json();
      const savedPlaces: CustomPlace[] = await placesResponse.json();
      const validDrivers = data.filter((driver) => Number.isFinite(driver.lat) && Number.isFinite(driver.lng));
      const validPlaces = savedPlaces.filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
      setDrivers(validDrivers);
      setSurgeZones(zones.filter((zone) => getSurgeZoneRing(zone).length >= 3));
      setPlaces(validPlaces);
      setSelectedDriverId((current) => (current && validDrivers.some((driver) => driver.id === current) ? current : null));
      setLastUpdated(new Date());
      setError(null);
      setFitVersion((version) => version + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch driver data.");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    const token = getToken();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || apiUrl.replace(/\/api\/?$/, "");

    if (!token) return;

    const socket = io(wsUrl, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsLiveConnected(true);
      setLiveError(null);
      socket.emit("joinAdminTracking");
    });

    socket.on("driverLocationUpdated", (data: { driverId: string; lat: number; lng: number }) => {
      if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return;
      setDrivers((prevDrivers) => {
        const existingDriverIndex = prevDrivers.findIndex((driver) => driver.id === data.driverId);

        if (existingDriverIndex !== -1) {
          const updatedDrivers = [...prevDrivers];
          updatedDrivers[existingDriverIndex] = {
            ...updatedDrivers[existingDriverIndex],
            lat: data.lat,
            lng: data.lng,
          };
          return updatedDrivers;
        }

        return [...prevDrivers, { id: data.driverId, name: "Unknown", lat: data.lat, lng: data.lng }];
      });
      setLastUpdated(new Date());
    });

    socket.on("disconnect", () => {
      setIsLiveConnected(false);
    });

    socket.on("connect_error", (err) => {
      setIsLiveConnected(false);
      setLiveError(`Live updates unavailable: ${err.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-[1.4rem] border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive shadow-[0_24px_55px_rgba(0,33,20,0.12)]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 bg-transparent lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="noori-map-shell relative min-h-[520px]">
        <div className="absolute left-4 right-4 top-4 z-[500] flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="w-full max-w-md rounded-[1.45rem] border border-primary/15 bg-background/88 px-4 py-3 shadow-[0_18px_40px_rgba(0,33,20,0.14)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary/80">
              <Radio className={`h-3.5 w-3.5 ${isLiveConnected ? "animate-pulse" : ""}`} />
              Noori Fleet Grid
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={isLiveConnected ? "default" : "secondary"} className="gap-1.5 rounded-full px-3 py-1 font-semibold">
              {isLiveConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isLiveConnected ? "Live" : "Polling"}
              </Badge>
              <span className="text-xs text-muted-foreground">Updated {formatTime(lastUpdated)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl border border-primary/10 bg-primary/6 px-3 py-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">Tracked</span>
                <strong className="mt-1 block text-xl font-black text-foreground">{drivers.length}</strong>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-3 py-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-foreground/70">Active surge</span>
                <strong className="mt-1 block text-xl font-black text-foreground">{totals.activeSurgeZones}</strong>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-xl flex-wrap items-center gap-2 rounded-[1.35rem] border border-primary/15 bg-background/88 p-2 shadow-[0_18px_40px_rgba(0,33,20,0.14)] backdrop-blur-xl xl:w-fit">
            <Button size="sm" className="rounded-full" variant={visibleLayers.drivers ? "default" : "outline"} onClick={() => toggleLayer("drivers")}>
              Drivers
            </Button>
            <Button size="sm" className="rounded-full" variant={visibleLayers.zones ? "default" : "outline"} onClick={() => toggleLayer("zones")}>
              Surge
            </Button>
            <Button size="sm" className="rounded-full" variant={visibleLayers.places ? "default" : "outline"} onClick={() => toggleLayer("places")}>
              Places
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => loadDrivers(true)}
              disabled={isRefreshing}
              aria-label="Refresh map data"
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSelectedDriverId(null);
                setFitVersion((version) => version + 1);
              }}
              disabled={!drivers.length && !surgeZones.length && !places.length}
              aria-label="Fit map objects"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {liveError ? (
          <div className="absolute bottom-4 left-4 z-[500] max-w-sm rounded-2xl bg-destructive/92 px-4 py-3 text-sm text-destructive-foreground shadow-[0_18px_40px_rgba(0,33,20,0.18)]">
            {liveError}
          </div>
        ) : null}

        <MapContainer center={mapCenter} zoom={13} zoomControl={false} className="noori-map-canvas h-full w-full">
          <ViewportController drivers={visibleDrivers} surgeZones={visibleZones} places={visiblePlaces} fitVersion={fitVersion} selectedDriver={selectedDriver} />
          <NooriMapControls
            fitPoints={fitPoints}
            className="pointer-events-auto absolute bottom-4 left-4 z-[650] flex flex-row gap-2 sm:bottom-auto sm:left-auto sm:right-4 sm:top-28 sm:flex-col xl:top-4"
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
          {visibleZones.map((zone) => {
            const positions = getSurgeZoneRing(zone);
            return (
              <Polygon key={zone.id} positions={positions} pathOptions={getZonePathOptions(zone)}>
                <Popup>
                  <div className="noori-map-popup-card">
                    <h4>{zone.name}</h4>
                    <p>Surge pricing overlay</p>
                    <div className="noori-map-popup-meta">
                      <div>
                        <span>Multiplier</span>
                        <strong>{zone.multiplier}x</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{(zone.isCurrentlyActive ?? zone.isActive) ? "Active" : "Inactive"}</strong>
                      </div>
                    </div>
                    <p>Until {new Date(zone.activeUntil).toLocaleString()}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          {visibleDrivers.map((driver) => (
            <Marker
              key={driver.id}
              icon={createDriverIcon(driver.status, driver.id === selectedDriverId, driver.name)}
              position={[driver.lat, driver.lng]}
              eventHandlers={{ click: () => setSelectedDriverId(driver.id) }}
            >
              <Popup>
                <div className="noori-map-popup-card">
                  <h4>{driver.name}</h4>
                  <p>Fleet node {driver.id.slice(0, 8)}...</p>
                  <div className="noori-map-popup-meta">
                    <div>
                      <span>Status</span>
                      <strong>{getStatusLabel(driver.status)}</strong>
                    </div>
                    <div>
                      <span>Coordinates</span>
                      <strong>{driver.lat.toFixed(3)}, {driver.lng.toFixed(3)}</strong>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          {visiblePlaces.map((place) => (
            <Marker key={place.id} icon={createPlaceIcon()} position={[place.lat, place.lng]}>
              <Popup>
                <div className="noori-map-popup-card">
                  <h4>{place.name}</h4>
                  <p>{place.address}</p>
                  <div className="noori-map-popup-meta">
                    <div>
                      <span>Category</span>
                      <strong>{place.category ?? "Saved place"}</strong>
                    </div>
                    <div>
                      <span>City</span>
                      <strong>{place.city}</strong>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-4 right-4 z-[500] rounded-[1.35rem] border border-primary/15 bg-background/88 p-3 text-xs shadow-[0_18px_40px_rgba(0,33,20,0.14)] backdrop-blur-xl">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Online</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" />Busy</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#004d34]" />Place</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-accent/70" />Surge</span>
          </div>
        </div>
      </div>

      <aside className="min-h-0 overflow-hidden rounded-[1.75rem] border border-primary/12 bg-background/84 shadow-[0_24px_55px_rgba(0,33,20,0.12)] backdrop-blur-xl">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-primary/10 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Operations</h2>
              <p className="text-xs text-muted-foreground">{drivers.length} drivers with coordinates</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-primary/10 bg-background/85 p-3">
                <Users className="mb-2 h-4 w-4 text-primary" />
                <p className="text-2xl font-semibold">{drivers.length}</p>
                <p className="text-xs text-muted-foreground">Tracked</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-background/85 p-3">
                <Radio className="mb-2 h-4 w-4 text-primary" />
                <p className="text-2xl font-semibold">{totals.online}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <div className="rounded-2xl border border-accent/25 bg-accent/10 p-3">
                <LocateFixed className="mb-2 h-4 w-4 text-accent" />
                <p className="text-2xl font-semibold">{totals.busy}</p>
                <p className="text-xs text-muted-foreground">Busy</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-background/85 p-3">
                <Zap className="mb-2 h-4 w-4 text-primary" />
                <p className="text-2xl font-semibold">{totals.activeSurgeZones}</p>
                <p className="text-xs text-muted-foreground">Active surge</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => openModal("drivers")}
                className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-background/85 p-3 text-left transition-colors hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  Drivers
                </span>
                <Badge variant="secondary">{drivers.length}</Badge>
              </button>
              <button
                type="button"
                onClick={() => openModal("places")}
                className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-background/85 p-3 text-left transition-colors hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-accent" />
                  Custom Places
                </span>
                <Badge variant="secondary">{places.length}</Badge>
              </button>
              <button
                type="button"
                onClick={() => openModal("zones")}
                className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-background/85 p-3 text-left transition-colors hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4 text-primary" />
                  Surge Zones
                </span>
                <Badge variant={totals.activeSurgeZones ? "destructive" : "secondary"}>{surgeZones.length}</Badge>
              </button>
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="rounded-[1.35rem] border border-primary/10 bg-muted/20 p-4 text-sm text-muted-foreground">
              Use the map controls to show or hide layers. Open a modal to search and inspect drivers, custom places, or surge zones.
            </div>
          </div>
        </div>
      </aside>

      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-h-[82vh] gap-3 overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={modalSearch}
              onChange={(event) => setModalSearch(event.target.value)}
              placeholder={modalPlaceholder}
              className="pl-9"
            />
          </div>

          <div className="min-h-0 max-h-[56vh] overflow-y-auto rounded-md border">
            {activeModal === "drivers" ? (
              isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading online drivers...</div>
              ) : filteredDrivers.length ? (
                <div className="divide-y">
                  {filteredDrivers.map((driver) => {
                    const selected = driver.id === selectedDriverId;
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => {
                          setSelectedDriverId(driver.id);
                          setActiveModal(null);
                        }}
                        className={`block w-full p-4 text-left transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{driver.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{driver.id}</p>
                          </div>
                          <Badge variant={driver.status === "BUSY" ? "secondary" : "default"}>{driver.status ?? "ONLINE"}</Badge>
                        </div>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                          {driver.lat.toFixed(5)}, {driver.lng.toFixed(5)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No drivers match your search.</div>
              )
            ) : null}

            {activeModal === "places" ? (
              filteredPlaces.length ? (
                <div className="divide-y">
                  {filteredPlaces.map((place) => (
                    <div key={place.id} className="p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{place.name}</p>
                          <p className="truncate text-muted-foreground">{place.address}</p>
                        </div>
                        {place.category ? <Badge variant="outline">{place.category}</Badge> : null}
                      </div>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        {place.lat.toFixed(5)}, {place.lng.toFixed(5)} · {place.city}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No custom places match your search.</div>
              )
            ) : null}

            {activeModal === "zones" ? (
              filteredZones.length ? (
                <div className="divide-y">
                  {filteredZones.map((zone) => (
                    <div key={zone.id} className="p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">Until {new Date(zone.activeUntil).toLocaleString()}</p>
                        </div>
                        <Badge variant={(zone.isCurrentlyActive ?? zone.isActive) ? "destructive" : "secondary"}>
                          {zone.multiplier}x
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(zone.isCurrentlyActive ?? zone.isActive) ? "Active" : "Inactive"} · {getSurgeZoneRing(zone).length} map points
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No surge zones match your search.</div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
