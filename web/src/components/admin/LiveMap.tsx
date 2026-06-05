"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { io, Socket } from "socket.io-client";
import { Crosshair, Layers, LocateFixed, MapPin, Radio, RefreshCw, Users, Wifi, WifiOff, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiUrl, getToken } from "@/lib/auth";

import "leaflet/dist/leaflet.css";

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
  return status === "BUSY" ? "#f59e0b" : "#16a34a";
}

function createDriverIcon(status?: string, selected = false) {
  const color = getStatusColor(status);
  const size = selected ? 34 : 28;
  const ring = selected ? "0 0 0 6px rgba(37, 99, 235, 0.18)" : "0 0 0 4px rgba(255, 255, 255, 0.85)";

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:${ring},0 10px 20px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:800;">D</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function createPlaceIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:#f97316;border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.24);display:flex;align-items:center;justify-content:center;"><div style="width:7px;height:7px;border-radius:9999px;background:white;"></div></div>`,
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
    color: active ? "#dc2626" : "#64748b",
    fillColor: active ? "#ef4444" : "#94a3b8",
    fillOpacity: active ? 0.18 : 0.08,
    opacity: active ? 0.9 : 0.45,
    weight: active ? 2 : 1,
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
        <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] bg-background lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
      <div className="relative min-h-[420px]">
        <div className="absolute left-4 top-4 z-[500] flex flex-wrap items-center gap-2">
          <Badge variant={isLiveConnected ? "default" : "secondary"} className="gap-1.5">
            {isLiveConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isLiveConnected ? "Live" : "Polling"}
          </Badge>
          <div className="rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow">
            Updated {formatTime(lastUpdated)}
          </div>
        </div>

        {liveError ? (
          <div className="absolute right-4 top-4 z-[500] max-w-sm rounded-md bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground shadow">
            {liveError}
          </div>
        ) : null}

        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <ViewportController drivers={drivers} surgeZones={surgeZones} places={places} fitVersion={fitVersion} selectedDriver={selectedDriver} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {surgeZones.map((zone) => {
            const positions = getSurgeZoneRing(zone);
            return (
              <Polygon key={zone.id} positions={positions} pathOptions={getZonePathOptions(zone)}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{zone.name}</p>
                    <p>Multiplier: {zone.multiplier}x</p>
                    <p>Status: {(zone.isCurrentlyActive ?? zone.isActive) ? "Active" : "Inactive"}</p>
                    <p>Until: {new Date(zone.activeUntil).toLocaleString()}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          {drivers.map((driver) => (
            <Marker
              key={driver.id}
              icon={createDriverIcon(driver.status, driver.id === selectedDriverId)}
              position={[driver.lat, driver.lng]}
              eventHandlers={{ click: () => setSelectedDriverId(driver.id) }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{driver.name}</p>
                  <p>ID: {driver.id.slice(0, 8)}...</p>
                  <p>Status: {driver.status ?? "ONLINE"}</p>
                  <p>
                    Lat: {driver.lat.toFixed(4)}, Lng: {driver.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          {places.map((place) => (
            <Marker key={place.id} icon={createPlaceIcon()} position={[place.lat, place.lng]}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{place.name}</p>
                  <p>{place.address}</p>
                  {place.category ? <p>Category: {place.category}</p> : null}
                  <p>
                    Lat: {place.lat.toFixed(4)}, Lng: {place.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <aside className="min-h-0 border-t bg-background lg:border-l lg:border-t-0">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Fleet Snapshot</h2>
                <p className="text-sm text-muted-foreground">{drivers.length} drivers with live coordinates</p>
              </div>
              <Button size="icon" variant="outline" onClick={() => loadDrivers(true)} disabled={isRefreshing} aria-label="Refresh drivers">
                <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-md border p-3">
                <Users className="mb-2 h-4 w-4 text-primary" />
                <p className="text-2xl font-semibold">{drivers.length}</p>
                <p className="text-xs text-muted-foreground">Tracked</p>
              </div>
              <div className="rounded-md border p-3">
                <Radio className="mb-2 h-4 w-4 text-green-600" />
                <p className="text-2xl font-semibold">{totals.online}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <div className="rounded-md border p-3">
                <LocateFixed className="mb-2 h-4 w-4 text-amber-600" />
                <p className="text-2xl font-semibold">{totals.busy}</p>
                <p className="text-xs text-muted-foreground">Busy</p>
              </div>
            </div>
            <div className="mt-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Surge zones</span>
                </div>
                <Badge variant={totals.activeSurgeZones ? "destructive" : "secondary"}>
                  {totals.activeSurgeZones} active
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {surgeZones.length} configured zone{surgeZones.length === 1 ? "" : "s"} shown on the map
              </p>
            </div>
            <div className="mt-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Custom places</span>
                </div>
                <Badge variant="secondary">{totals.places}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Saved rider pickup and destination places shown on the map
              </p>
            </div>

            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => {
                setSelectedDriverId(null);
                setFitVersion((version) => version + 1);
              }}
              disabled={!drivers.length && !surgeZones.length && !places.length}
            >
              <Crosshair className="h-4 w-4" />
              Fit Map Objects
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {surgeZones.length ? (
              <div className="mb-3 rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4" />
                  Surge Overlays
                </div>
                <div className="space-y-2">
                  {surgeZones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{zone.name}</span>
                      <Badge variant={(zone.isCurrentlyActive ?? zone.isActive) ? "destructive" : "secondary"}>
                        {zone.multiplier}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {places.length ? (
              <div className="mb-3 rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  Custom Places
                </div>
                <div className="space-y-2">
                  {places.map((place) => (
                    <div key={place.id} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium">{place.name}</span>
                        {place.category ? <Badge variant="outline">{place.category}</Badge> : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{place.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {isLoading ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">Loading online drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">No online drivers with coordinates.</div>
            ) : (
              <div className="space-y-2">
                {drivers.map((driver) => {
                  const selected = driver.id === selectedDriverId;
                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{driver.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{driver.id.slice(0, 10)}</p>
                        </div>
                        <Badge variant={driver.status === "BUSY" ? "secondary" : "default"}>{driver.status ?? "ONLINE"}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {driver.lat.toFixed(5)}, {driver.lng.toFixed(5)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
