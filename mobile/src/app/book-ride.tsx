import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import {
  Banknote,
  Car,
  ChevronLeft,
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  bookRide,
  getRideEstimate,
  getSavedPlaces,
  getStoredUser,
  PlaceSuggestion,
  RideEstimate,
  SavedPlace,
  searchPlaces,
} from '../lib/api';
import { safeBack } from '../lib/navigation';
import { PatternOverlay } from '../components/PatternOverlay';
import { withSessionGuard } from '../lib/SessionGuard';

const KABUL_COORDS = { lat: 34.5553, lng: 69.2075 };
const RECENT_DESTINATIONS_KEY = 'noori_recent_destinations';

type Coords = { lat: number; lng: number };
type RideType = {
  id: 'economy' | 'comfort' | 'women' | 'xl';
  title: string;
  subtitle: string;
  multiplier: number;
};

const RIDE_TYPES: RideType[] = [
  { id: 'economy', title: 'book_ride.economy', subtitle: 'book_ride.economy_sub', multiplier: 1 },
  { id: 'comfort', title: 'book_ride.comfort', subtitle: 'book_ride.comfort_sub', multiplier: 1.25 },
  { id: 'women', title: 'book_ride.women', subtitle: 'book_ride.women_sub', multiplier: 1.15 },
  { id: 'xl', title: 'book_ride.xl', subtitle: 'book_ride.xl_sub', multiplier: 1.45 },
];

const PICKUP_NOTES = [
  'book_ride.note_gate',
  'book_ride.note_call',
  'book_ride.note_cash',
  'book_ride.note_women',
];

function haversineKm(a?: Coords | null, b?: Coords | null) {
  if (!a || !b) return 5;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.max(1, Math.round(earthKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10);
}

function nearbyDrivers(center: Coords) {
  return [
    { id: 'd1', lat: center.lat + 0.004, lng: center.lng - 0.003 },
    { id: 'd2', lat: center.lat - 0.003, lng: center.lng + 0.004 },
    { id: 'd3', lat: center.lat + 0.002, lng: center.lng + 0.005 },
  ];
}

async function loadRecentDestinations() {
  const raw = Platform.OS === 'web'
    ? localStorage.getItem(RECENT_DESTINATIONS_KEY)
    : await AsyncStorage.getItem(RECENT_DESTINATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedPlace[];
  } catch {
    return [];
  }
}

async function saveRecentDestination(place: SavedPlace) {
  const current = await loadRecentDestinations();
  const next = [place, ...current.filter((item) => item.address !== place.address)].slice(0, 6);
  const value = JSON.stringify(next);
  if (Platform.OS === 'web') localStorage.setItem(RECENT_DESTINATIONS_KEY, value);
  else await AsyncStorage.setItem(RECENT_DESTINATIONS_KEY, value);
}

function BookRideScreen() {
  const { t } = useTranslation();
  const nativeMaps = React.useMemo(
    () => (Platform.OS === 'web' ? null : require('react-native-maps')),
    [],
  );
  const MapView = nativeMaps?.default;
  const Marker = nativeMaps?.Marker;
  const Polyline = nativeMaps?.Polyline;
  const Circle = nativeMaps?.Circle;

  const [pickupLocation, setPickupLocation] = React.useState('');
  const [dropoffLocation, setDropoffLocation] = React.useState('');
  const [pickupCoords, setPickupCoords] = React.useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords] = React.useState<Coords | null>(null);
  const [routeCoords, setRouteCoords] = React.useState<Coords[]>([]);
  const [routeDistance, setRouteDistance] = React.useState(5);
  const [routeMinutes, setRouteMinutes] = React.useState(14);
  const [estimate, setEstimate] = React.useState<RideEstimate | null>(null);
  const [savedPlaces, setSavedPlaces] = React.useState<SavedPlace[]>([]);
  const [recentPlaces, setRecentPlaces] = React.useState<SavedPlace[]>([]);
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [rideType, setRideType] = React.useState<RideType>(RIDE_TYPES[0]);
  const [note, setNote] = React.useState('');
  const [safetyCode, setSafetyCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [locationMessage, setLocationMessage] = React.useState('');
  const [locationAccuracy, setLocationAccuracy] = React.useState<number | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const mapCenter = React.useMemo(() => {
    if (pickupCoords && dropoffCoords) {
      return {
        lat: (pickupCoords.lat + dropoffCoords.lat) / 2,
        lng: (pickupCoords.lng + dropoffCoords.lng) / 2,
      };
    }
    return pickupCoords ?? dropoffCoords ?? KABUL_COORDS;
  }, [dropoffCoords, pickupCoords]);

  const mapRegion = React.useMemo(
    () => ({
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
      latitudeDelta: pickupCoords && dropoffCoords ? Math.max(Math.abs(pickupCoords.lat - dropoffCoords.lat) * 2.5, 0.035) : 0.025,
      longitudeDelta: pickupCoords && dropoffCoords ? Math.max(Math.abs(pickupCoords.lng - dropoffCoords.lng) * 2.5, 0.035) : 0.025,
    }),
    [dropoffCoords, mapCenter.lat, mapCenter.lng, pickupCoords],
  );

  const driverMarkers = React.useMemo(() => nearbyDrivers(pickupCoords ?? mapCenter), [mapCenter, pickupCoords]);
  const mapStatus = locating
    ? t('book_ride.status_finding')
    : pickupCoords && dropoffCoords
      ? t('book_ride.status_route_ready')
      : pickupCoords
        ? t('book_ride.status_set_destination')
        : t('book_ride.status_waiting');
  const baseFare = Number(estimate?.baseFare ?? 80);
  const distanceFare = Math.round(Number(estimate?.perKm ?? 35) * routeDistance);
  const surgeFare = Math.max(0, Math.round((baseFare + distanceFare) * (Number(estimate?.surgeMultiplier ?? 1) - 1)));
  const rideTypeFare = Math.round((baseFare + distanceFare + surgeFare) * (rideType.multiplier - 1));
  const totalFare = Math.round((baseFare + distanceFare + surgeFare) * rideType.multiplier);

  const setPickupFromDeviceLocation = React.useCallback((location: Location.LocationObject) => {
    const next = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
    setPickupCoords(next);
    setPickupLocation(t('book_ride.exact_location'));
    setLocationAccuracy(location.coords.accuracy ?? null);
    setLocationMessage(location.coords.accuracy ? t('book_ride.location_accuracy', { meters: Math.round(location.coords.accuracy) }) : t('book_ride.using_current_location'));
  }, [t]);

  const refreshCurrentLocation = React.useCallback(async () => {
    setLocating(true);
    setLocationMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationMessage(t('book_ride.location_permission_needed'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setPickupFromDeviceLocation(location);
    } catch (e) {
      console.log('Location error:', e);
      setLocationMessage(t('book_ride.location_error'));
    } finally {
      setLocating(false);
    }
  }, [setPickupFromDeviceLocation]);

  React.useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    (async () => {
      await refreshCurrentLocation();
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        setPickupFromDeviceLocation,
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [refreshCurrentLocation, setPickupFromDeviceLocation]);

  React.useEffect(() => {
    getSavedPlaces().then(setSavedPlaces);
    loadRecentDestinations().then(setRecentPlaces);
  }, []);

  React.useEffect(() => {
    const query = dropoffLocation.trim();
    if (query.length < 2 || dropoffCoords) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(query)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [dropoffCoords, dropoffLocation]);

  React.useEffect(() => {
    const fallbackDistance = haversineKm(pickupCoords, dropoffCoords);
    setRouteDistance(fallbackDistance);
    setRouteMinutes(Math.max(5, Math.round((fallbackDistance / 22) * 60)));
    setRouteCoords(pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : []);

    if (!pickupCoords || !dropoffCoords) return;

    const controller = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates;
        if (!Array.isArray(coordinates)) return;
        setRouteCoords(coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })));
        setRouteDistance(Math.max(1, Math.round((Number(route.distance) / 1000) * 10) / 10));
        setRouteMinutes(Math.max(3, Math.round(Number(route.duration) / 60)));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [dropoffCoords, pickupCoords]);

  React.useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(() => {
      getRideEstimate(routeDistance, pickupCoords?.lat, pickupCoords?.lng)
        .then(setEstimate)
        .catch(() => setEstimate(null));
    }, 250);

    return () => clearTimeout(timer);
  }, [dropoffLocation, pickupCoords?.lat, pickupCoords?.lng, pickupLocation, routeDistance]);

  function chooseDropoff(place: SavedPlace | PlaceSuggestion) {
    setDropoffLocation(place.address);
    setDropoffCoords({ lat: Number(place.lat), lng: Number(place.lng) });
    setSuggestions([]);
  }

  function handleMapPress(event: any) {
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) return;
    const next = { lat: coordinate.latitude, lng: coordinate.longitude };
    setDropoffCoords(next);
    setDropoffLocation(t('book_ride.pinned_destination'));
    setSuggestions([]);
  }

  function openConfirmation() {
    setMessage('');
    if (!pickupLocation || !dropoffLocation || !pickupCoords) {
      setMessage(t('book_ride.set_pickup_destination'));
      return;
    }
    setConfirmOpen(true);
  }

  async function confirm() {
    setMessage('');
    setSafetyCode('');
    setLoading(true);
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const bookingNotes = [
        rideType.id !== 'economy' ? `${t('book_ride.ride_type')}: ${t(rideType.title)}` : '',
        note.trim() ? `Pickup note: ${note.trim()}` : '',
      ].filter(Boolean).join(' | ');

      const ride = await bookRide({
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        dropoffLat: dropoffCoords?.lat,
        dropoffLng: dropoffCoords?.lng,
        distance: routeDistance,
        duration: routeMinutes,
        paymentMethod: 'CASH',
        notes: bookingNotes || undefined,
      });

      if (dropoffCoords) {
        await saveRecentDestination({
          id: `recent-${Date.now()}`,
          label: dropoffLocation.split(',')[0] || 'Recent',
          address: dropoffLocation,
          lat: dropoffCoords.lat,
          lng: dropoffCoords.lng,
        });
        setRecentPlaces(await loadRecentDestinations());
      }

      setConfirmOpen(false);
      setSafetyCode(ride.safetyCode ?? '');
      setMessage(t('book_ride.ride_requested', { amount: Number(ride.fare ?? totalFare).toLocaleString() }));
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="flex-row items-center mb-6 gap-4">
            <TouchableOpacity onPress={() => safeBack(router)} className="p-3 bg-card rounded-2xl border border-muted/20 shadow-sm">
              <ChevronLeft size={20} color="#006947" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">{t('book_ride.title', 'Book a Ride')}</Text>
          </View>

          <View className="h-80 rounded-3xl overflow-hidden border border-muted/20 shadow-sm bg-muted/10 relative">
            {MapView ? (
              <MapView style={{ flex: 1 }} region={mapRegion} showsUserLocation onPress={handleMapPress}>
                {driverMarkers.map((driver) => Marker ? (
                  <Marker key={driver.id} coordinate={{ latitude: driver.lat, longitude: driver.lng }} title={t('book_ride.nearby_driver')}>
                    <View className="w-9 h-9 rounded-full bg-white border border-blue-100 items-center justify-center shadow-sm">
                      <Car size={18} color="#2563eb" />
                    </View>
                  </Marker>
                ) : null)}
                {pickupCoords && Circle && locationAccuracy ? (
                  <Circle
                    center={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }}
                    radius={Math.max(20, Math.min(locationAccuracy, 120))}
                    strokeColor="rgba(0,105,71,0.25)"
                    fillColor="rgba(0,105,71,0.08)"
                  />
                ) : null}
                {pickupCoords && Marker ? (
                  <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} title={pickupLocation || 'Pickup'}>
                    <View className="items-center">
                      <View className="bg-primary px-3 py-1 rounded-full mb-1">
                        <Text className="text-white text-[10px] font-black uppercase">{t('book_ride.pickup')}</Text>
                      </View>
                      <View className="w-7 h-7 rounded-full bg-white border-4 border-primary items-center justify-center">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                      </View>
                    </View>
                  </Marker>
                ) : null}
                {dropoffCoords && Marker ? (
                  <Marker coordinate={{ latitude: dropoffCoords.lat, longitude: dropoffCoords.lng }} title={dropoffLocation || 'Dropoff'}>
                    <View className="items-center">
                      <View className="bg-accent px-3 py-1 rounded-full mb-1">
                        <Text className="text-foreground text-[10px] font-black uppercase">{t('book_ride.dropoff')}</Text>
                      </View>
                      <View className="w-8 h-8 rounded-full bg-white border-4 border-accent items-center justify-center">
                        <Navigation size={13} color="#D4AF37" />
                      </View>
                    </View>
                  </Marker>
                ) : null}
                {routeCoords.length > 1 && Polyline ? (
                  <Polyline coordinates={routeCoords.map((point) => ({ latitude: point.lat, longitude: point.lng }))} strokeColor="#006947" strokeWidth={4} />
                ) : null}
              </MapView>
            ) : (
              <View className="flex-1 bg-[#eef4ef] relative overflow-hidden">
                <View className="absolute left-[-20%] top-10 h-8 w-[140%] rotate-[-18deg] bg-white/80" />
                <View className="absolute left-[-10%] top-32 h-7 w-[125%] rotate-[12deg] bg-white/70" />
                <View className="absolute left-16 top-[-20%] h-[150%] w-7 rotate-[28deg] bg-white/60" />
                <View className="absolute right-20 top-[-10%] h-[130%] w-6 rotate-[-8deg] bg-white/50" />
                <View className="absolute left-8 bottom-10 h-20 w-28 rounded-3xl bg-primary/10" />
                <View className="absolute right-8 top-20 h-24 w-24 rounded-3xl bg-accent/15" />
                {driverMarkers.map((driver, index) => (
                  <View
                    key={driver.id}
                    className="absolute w-9 h-9 rounded-full bg-white border border-blue-100 items-center justify-center shadow-sm"
                    style={{
                      left: `${22 + index * 24}%`,
                      top: `${32 + (index % 2) * 20}%`,
                    }}
                  >
                    <Car size={18} color="#2563eb" />
                  </View>
                ))}
                {routeCoords.length > 1 ? (
                  <View className="absolute left-[26%] top-[48%] h-1 w-[46%] rounded-full bg-primary rotate-[-12deg]" />
                ) : null}
                {pickupCoords ? (
                  <View className="absolute left-[22%] top-[50%] items-center">
                    <View className="bg-primary px-3 py-1 rounded-full mb-1">
                      <Text className="text-white text-[10px] font-black uppercase">Pickup</Text>
                    </View>
                    <View className="w-7 h-7 rounded-full bg-white border-4 border-primary items-center justify-center">
                      <View className="w-2 h-2 rounded-full bg-primary" />
                    </View>
                  </View>
                ) : null}
                {dropoffCoords ? (
                  <View className="absolute right-[18%] top-[38%] items-center">
                    <View className="bg-accent px-3 py-1 rounded-full mb-1">
                      <Text className="text-foreground text-[10px] font-black uppercase">Dropoff</Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-white border-4 border-accent items-center justify-center">
                      <Navigation size={13} color="#D4AF37" />
                    </View>
                  </View>
                ) : null}
              </View>
            )}
            {!pickupCoords ? (
              <View className="absolute inset-0 bg-white/80 items-center justify-center px-8">
                <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <Crosshair size={26} color="#006947" />
                </View>
                <Text className="text-base font-black text-foreground text-center">{t('book_ride.map_finding')}</Text>
                <Text className="text-xs font-bold text-muted-foreground text-center mt-2">
                  {t('book_ride.map_permission')}
                </Text>
              </View>
            ) : null}
            <View className="absolute top-3 left-3 right-3 flex-row items-start justify-between gap-3">
              <View className="flex-1 bg-white/95 rounded-2xl px-4 py-3 border border-muted/20 shadow-sm">
                <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('book_ride.map_status')}</Text>
                <Text className="text-sm font-black text-foreground mt-1">{mapStatus}</Text>
              </View>
              <View className="bg-white/95 rounded-2xl border border-muted/20 shadow-sm overflow-hidden">
                <TouchableOpacity onPress={refreshCurrentLocation} disabled={locating} className="w-12 h-12 items-center justify-center border-b border-muted/10">
                  <Crosshair size={19} color="#006947" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setDropoffCoords(null);
                    setDropoffLocation('');
                    setSuggestions([]);
                  }}
                  className="w-12 h-12 items-center justify-center"
                >
                  <XCircle size={19} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="absolute bottom-3 left-3 right-3">
              <View className="bg-white/95 rounded-2xl px-4 py-3 border border-muted/20 shadow-sm flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('book_ride.route')}</Text>
                  <Text className="text-base font-black text-foreground">
                    {dropoffCoords ? `${routeDistance.toFixed(1)} km · ${routeMinutes} min` : t('book_ride.choose_destination')}
                  </Text>
                </View>
                <View className="bg-primary/10 rounded-2xl px-3 py-2">
                  <Text className="text-primary font-black">AFN {dropoffCoords ? totalFare.toLocaleString() : '--'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-6 gap-3">
            <Text className="flex-1 text-xs font-bold text-muted-foreground">
              {locationMessage || t('book_ride.location_hint')}
            </Text>
            <TouchableOpacity
              onPress={refreshCurrentLocation}
              disabled={locating}
              className={`px-4 py-3 rounded-2xl border ${locating ? 'bg-muted/20 border-muted/20' : 'bg-primary/5 border-primary/10'}`}
            >
              <Text className="text-primary text-xs font-black uppercase">
                {locating ? t('book_ride.locating') : t('book_ride.use_exact')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-card p-5 rounded-3xl shadow-sm border border-muted/10 mb-5">
            <View>
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">{t('book_ride.from')}</Text>
              <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                <MapPin size={20} color="#006947" />
                <TextInput
                  value={pickupLocation}
                  editable={false}
                  selectTextOnFocus={false}
                  placeholder={t('book_ride.exact_location')}
                  className="flex-1 ml-3 text-base font-bold text-foreground opacity-80"
                />
              </View>
              <Text className="text-[10px] text-muted-foreground mt-2 ml-1 font-bold">
                {t('book_ride.pickup_locked')}
              </Text>
            </View>

            <View className="h-4 items-center">
              <View className="w-[1px] h-full bg-muted/30" />
            </View>

            <View>
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">{t('book_ride.to')}</Text>
              <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                <Navigation size={20} color="#D4AF37" />
                <TextInput
                  value={dropoffLocation}
                  onChangeText={(value) => {
                    setDropoffLocation(value);
                    setDropoffCoords(null);
                  }}
                  placeholder={t('book_ride.destination_placeholder', 'Destination')}
                  className="flex-1 ml-3 text-base font-bold text-foreground"
                />
              </View>
            </View>

            {suggestions.length ? (
              <View className="mt-3 border border-muted/20 rounded-2xl overflow-hidden">
                {suggestions.map((place) => (
                  <TouchableOpacity key={place.id} onPress={() => chooseDropoff(place)} className="p-4 border-b border-muted/10 bg-white">
                    <Text className="font-bold text-foreground">{place.name}</Text>
                    <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>{place.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {[...savedPlaces, ...recentPlaces].length ? (
            <View className="mb-5">
              <Text className="text-xs font-black text-muted-foreground uppercase mb-3 ml-1 tracking-widest">{t('book_ride.saved_recent')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {[...savedPlaces, ...recentPlaces].map((place) => (
                    <TouchableOpacity
                      key={`${place.id}-${place.address}`}
                      onPress={() => chooseDropoff(place)}
                      className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3"
                    >
                      <Text className="text-primary font-bold">{place.label}</Text>
                      <Text className="text-[10px] text-muted-foreground mt-1" numberOfLines={1}>{place.address}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <View className="mb-5">
            <Text className="text-xs font-black text-muted-foreground uppercase mb-3 ml-1 tracking-widest">{t('book_ride.ride_type')}</Text>
            <View className="flex-row flex-wrap justify-between">
              {RIDE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setRideType(type)}
                  className={`w-[48%] p-4 rounded-3xl border mb-3 ${rideType.id === type.id ? 'bg-primary border-primary' : 'bg-card border-muted/20'}`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`font-black ${rideType.id === type.id ? 'text-white' : 'text-foreground'}`}>{t(type.title)}</Text>
                    {type.id === 'xl' ? <Users size={18} color={rideType.id === type.id ? '#fff' : '#006947'} /> : <Car size={18} color={rideType.id === type.id ? '#fff' : '#006947'} />}
                  </View>
                  <Text className={`text-xs ${rideType.id === type.id ? 'text-white/70' : 'text-muted-foreground'}`}>{t(type.subtitle)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-card rounded-3xl border border-muted/20 p-5 mb-5">
            <Text className="text-xs font-black text-muted-foreground uppercase mb-3 tracking-widest">{t('book_ride.pickup_notes')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {PICKUP_NOTES.map((item) => (
                <TouchableOpacity key={item} onPress={() => setNote(t(item))} className="bg-muted/20 border border-muted/20 rounded-2xl px-3 py-2">
                  <Text className="text-xs font-bold text-foreground">{t(item)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('book_ride.note_placeholder')}
              className="bg-muted/10 border border-muted/20 rounded-2xl px-4 py-3 text-sm font-bold text-foreground"
            />
          </View>

          <View className="bg-primary/5 rounded-3xl border border-primary/10 p-5 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="bg-primary/10 p-3 rounded-2xl">
                  <Car size={20} color="#006947" />
                </View>
                <View>
                  <Text className="font-bold text-foreground">{t('book_ride.fare_preview', 'Fare preview')}</Text>
                  <Text className="text-[10px] text-muted-foreground uppercase font-black">{routeDistance.toFixed(1)} km · {routeMinutes} min</Text>
                </View>
              </View>
              <Text className="text-2xl font-black text-primary">AFN {totalFare.toLocaleString()}</Text>
            </View>
            <View className="gap-2">
              <FareRow label={t('book_ride.base_fare')} value={baseFare} />
              <FareRow label={t('book_ride.distance')} value={distanceFare} />
              <FareRow label={`Surge x${Number(estimate?.surgeMultiplier ?? 1).toFixed(1)}`} value={surgeFare} />
              <FareRow label={t(rideType.title)} value={rideTypeFare} />
            </View>
          </View>

          {safetyCode ? (
            <View className="bg-primary rounded-3xl p-7 mb-6 shadow-high-tech overflow-hidden relative">
              <PatternOverlay color="#ffffff" opacity={0.1} />
              <View className="relative z-10 flex-row items-center justify-between">
                <View>
                  <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{t('book_ride.safety_code', 'Safety code')}</Text>
                  <Text className="text-4xl font-black text-white">{safetyCode}</Text>
                </View>
                <View className="bg-accent p-4 rounded-3xl">
                  <ShieldCheck size={32} color="#002113" />
                </View>
              </View>
            </View>
          ) : null}

          {message ? (
            <View className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <Text className="text-primary font-bold text-center text-xs">{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={openConfirmation}
            disabled={loading || !pickupLocation || !dropoffLocation}
            className={`h-16 rounded-3xl items-center justify-center shadow-lg mb-10 ${loading || !pickupLocation || !dropoffLocation ? 'bg-muted shadow-none' : 'bg-primary shadow-primary/30'}`}
          >
            <Text className="text-white text-lg font-black uppercase tracking-widest">
              {loading ? t('book_ride.confirming', 'Confirming...') : t('book_ride.review_ride')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => setConfirmOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border border-muted/20">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-black text-foreground">{t('book_ride.confirm_title')}</Text>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} className="p-2 bg-muted/20 rounded-2xl">
                <X size={20} color="#52635a" />
              </TouchableOpacity>
            </View>
            <ConfirmRow icon={<Crosshair size={18} color="#006947" />} label={t('book_ride.pickup')} value={pickupLocation} />
            <ConfirmRow icon={<Navigation size={18} color="#D4AF37" />} label={t('book_ride.dropoff')} value={dropoffLocation} />
            <ConfirmRow icon={<Clock size={18} color="#006947" />} label={t('book_ride.route')} value={`${routeDistance.toFixed(1)} km · ${routeMinutes} min`} />
            <ConfirmRow icon={<Sparkles size={18} color="#006947" />} label={t('book_ride.ride_type')} value={t(rideType.title)} />
            <ConfirmRow icon={<Banknote size={18} color="#006947" />} label={t('book_ride.payment')} value={t('book_ride.cash_payment', { amount: totalFare.toLocaleString() })} />
            {note ? <ConfirmRow icon={<MapPin size={18} color="#006947" />} label={t('book_ride.note')} value={note} /> : null}
            <TouchableOpacity
              onPress={confirm}
              disabled={loading}
              className={`h-16 rounded-3xl items-center justify-center mt-5 ${loading ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="text-white text-lg font-black uppercase tracking-widest">
                {loading ? t('book_ride.booking') : t('book_ride.confirm_title')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-xs font-bold text-muted-foreground">{label}</Text>
      <Text className="text-xs font-black text-foreground">AFN {Math.max(0, Math.round(value)).toLocaleString()}</Text>
    </View>
  );
}

function ConfirmRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3 py-3 border-b border-muted/10">
      <View className="w-9 h-9 rounded-2xl bg-primary/5 items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</Text>
        <Text className="text-sm font-bold text-foreground mt-1" numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

export default withSessionGuard(BookRideScreen);
