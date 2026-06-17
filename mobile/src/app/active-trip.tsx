import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import {
  Car,
  Clock,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Share2,
  Star,
  User,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  AuthUser,
  API_URL,
  cancelTrip,
  getAuthToken,
  getDriverTripActionLabel,
  getNextDriverTripStatus,
  getStoredUser,
  getTrips,
  raiseSos,
  SOCKET_URL,
  Trip,
  updateTripStatus,
} from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

type DriverLocation = {
  lat: number;
  lng: number;
  timestamp?: string;
};

type Coords = { lat: number; lng: number };

const KABUL = { lat: 34.5553, lng: 69.2075 };
const CANCEL_REASONS = [
  'active_trip.cancel_reason_wait',
  'active_trip.cancel_reason_wrong_location',
  'active_trip.cancel_reason_changed',
  'active_trip.cancel_reason_other',
];

function haversineKm(a?: Coords | null, b?: Coords | null) {
  if (!a || !b) return 4;
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

function tripStatusTone(status?: string) {
  if (status === 'CANCELLED') return 'bg-destructive/10 text-destructive';
  if (status === 'COMPLETED') return 'bg-success/10 text-success';
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary';
  return 'bg-accent/15 text-accent';
}

function ActiveTripScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const nativeMaps = React.useMemo(
    () => (Platform.OS === 'web' ? null : require('react-native-maps')),
    [],
  );
  const MapView = nativeMaps?.default;
  const Marker = nativeMaps?.Marker;
  const Polyline = nativeMaps?.Polyline;
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [location, setLocation] = React.useState<DriverLocation | null>(null);
  const [sosSubmitting, setSosSubmitting] = React.useState(false);
  const [statusSubmitting, setStatusSubmitting] = React.useState(false);
  const [cancelSubmitting, setCancelSubmitting] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);
  const [safetyOpen, setSafetyOpen] = React.useState(false);
  const [enteredSafetyCode, setEnteredSafetyCode] = React.useState('');
  const [activeAlertId, setActiveAlertId] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let nextSocket: Socket | null = null;

    async function connect() {
      const token = await getAuthToken();
      if (!token || !tripId || !mounted) return;

      nextSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = nextSocket;

      nextSocket.on('connect', () => {
        setConnected(true);
        nextSocket?.emit('joinTrip', tripId);
      });
      nextSocket.on('disconnect', () => setConnected(false));
      nextSocket.on('locationUpdated', setLocation);
    }

    void connect();
    return () => {
      mounted = false;
      nextSocket?.disconnect();
      if (socketRef.current === nextSocket) socketRef.current = null;
    };
  }, [tripId]);

  React.useEffect(() => {
    let mounted = true;

    async function loadTripState() {
      const storedUser = await getStoredUser();
      if (!storedUser || !tripId || !mounted) return;

      const trips = await getTrips(storedUser.id).catch(() => []);

      if (mounted) {
        setUser(storedUser);
        setTrip(trips.find((item) => item.id === tripId) ?? null);
      }
    }

    void loadTripState();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  const isDriver = user?.role === 'DRIVER';
  const pickupCoords = trip?.pickupLat != null && trip?.pickupLng != null
    ? { lat: trip.pickupLat, lng: trip.pickupLng }
    : null;
  const dropoffCoords = trip?.dropoffLat != null && trip?.dropoffLng != null
    ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
    : null;
  const driverCoords = location ? { lat: location.lat, lng: location.lng } : null;
  const mapCenter = driverCoords ?? pickupCoords ?? dropoffCoords ?? KABUL;
  const remainingKm = haversineKm(driverCoords ?? pickupCoords, dropoffCoords);
  const etaMinutes = Math.max(4, Math.round((remainingKm / 24) * 60));
  const routeCoords = [pickupCoords, dropoffCoords].filter(Boolean) as Coords[];
  const nextDriverStatus = isDriver ? getNextDriverTripStatus(trip?.status) : null;
  const driverActionLabel = isDriver ? getDriverTripActionLabel(trip?.status) : null;
  const canCancel = !isDriver && !!trip && !['COMPLETED', 'CANCELLED'].includes(trip.status);
  const contact = isDriver ? trip?.customer : trip?.driver;
  const contactName = contact?.name ?? (isDriver ? t('active_trip.rider_pending') : t('active_trip.driver_pending'));
  const contactPhone = contact?.phone ?? '';
  const driverRating = trip?.driver?.driverProfile?.ratingAverage ?? null;
  const driverCompletedTrips = trip?.driver?.driverProfile?.completedTrips ?? null;
  const vehicleName = trip?.vehicle
    ? [trip.vehicle.color, trip.vehicle.make, trip.vehicle.model].filter(Boolean).join(' ') || t('active_trip.vehicle_details_pending')
    : t('active_trip.vehicle_pending');
  const plateNumber = trip?.vehicle?.plateNumber ?? t('active_trip.plate_pending');
  const vehicleMeta = trip?.vehicle
    ? [
        trip.vehicle.type,
        trip.vehicle.capacity ? t('active_trip.seats', { count: trip.vehicle.capacity }) : null,
      ].filter(Boolean).join(' · ')
    : '';

  const region = {
    latitude: mapCenter.lat,
    longitude: mapCenter.lng,
    latitudeDelta: routeCoords.length ? 0.045 : 0.035,
    longitudeDelta: routeCoords.length ? 0.045 : 0.035,
  };

  React.useEffect(() => {
    if (!isDriver || !tripId || !connected) return;

    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    async function publishDriverLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 25,
          timeInterval: 10000,
        },
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(position.timestamp).toISOString(),
          };
          setLocation(nextLocation);
          socketRef.current?.emit('updateLocation', {
            tripId,
            lat: nextLocation.lat,
            lng: nextLocation.lng,
          });
        },
      );
    }

    void publishDriverLocation();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [connected, isDriver, tripId]);

  const handleDriverStatus = React.useCallback(async () => {
    if (!tripId || !nextDriverStatus || !user) return;

    if (nextDriverStatus === 'IN_PROGRESS' && trip?.safetyCode) {
      setEnteredSafetyCode('');
      setSafetyOpen(true);
      return;
    }

    try {
      setStatusSubmitting(true);
      const updatedTrip = await updateTripStatus(tripId, nextDriverStatus, user.id);
      setTrip(updatedTrip);

      if (updatedTrip.status === 'COMPLETED') {
        Alert.alert(t('active_trip.completed_title'), t('active_trip.completed_message'));
      }
    } catch (err) {
      Alert.alert(
        t('active_trip.update_failed_title'),
        err instanceof Error ? err.message : t('active_trip.try_again'),
      );
    } finally {
      setStatusSubmitting(false);
    }
  }, [tripId, nextDriverStatus, user, trip?.safetyCode, t]);

  const submitSafetyCodeAndStart = React.useCallback(async () => {
    if (!tripId || !user) return;
    try {
      setStatusSubmitting(true);
      const updatedTrip = await updateTripStatus(tripId, 'IN_PROGRESS', user.id, enteredSafetyCode.trim());
      setTrip(updatedTrip);
      setSafetyOpen(false);
      setEnteredSafetyCode('');
    } catch (err) {
      Alert.alert(
        t('active_trip.safety_code_invalid_title'),
        err instanceof Error ? err.message : t('active_trip.safety_code_invalid_message'),
      );
    } finally {
      setStatusSubmitting(false);
    }
  }, [enteredSafetyCode, tripId, user, t]);

  const handleCancelTrip = React.useCallback(async (reasonKey: string) => {
    if (!tripId) return;
    try {
      setCancelSubmitting(true);
      const updatedTrip = await cancelTrip(tripId, t(reasonKey));
      setTrip(updatedTrip);
      setCancelOpen(false);
      Alert.alert(t('active_trip.cancelled_title'), t('active_trip.cancelled_message'));
    } catch (err) {
      Alert.alert(
        t('active_trip.cancel_failed_title'),
        err instanceof Error ? err.message : t('active_trip.try_again'),
      );
    } finally {
      setCancelSubmitting(false);
    }
  }, [tripId, t]);

  const handleSos = React.useCallback(() => {
    if (!tripId || sosSubmitting) return;
    Alert.alert(
      t('active_trip.sos_confirm_title'),
      t('active_trip.sos_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('active_trip.send_sos'),
          style: 'destructive',
          onPress: async () => {
            try {
              setSosSubmitting(true);
              const result = await raiseSos({
                tripId,
                lat: location?.lat,
                lng: location?.lng,
              });
              setActiveAlertId(result.alert.id);
              Alert.alert(
                t('active_trip.sos_sent_title'),
                t('active_trip.sos_sent_message', {
                  count: result.notifiedContacts,
                  url: result.shareUrl ?? '',
                }),
              );
            } catch (err) {
              Alert.alert(
                t('active_trip.sos_failed_title'),
                err instanceof Error ? err.message : t('active_trip.try_again'),
              );
            } finally {
              setSosSubmitting(false);
            }
          },
        },
      ],
    );
  }, [tripId, location, sosSubmitting, t]);

  const handleShareTrip = React.useCallback(async () => {
    if (!trip?.safetyCode) {
      Alert.alert(t('active_trip.share_unavailable_title'), t('active_trip.share_unavailable_message'));
      return;
    }

    const shareUrl = `${API_URL}/trips/share/${encodeURIComponent(trip.safetyCode)}`;
    await Share.share({
      message: t('active_trip.share_message', {
        url: shareUrl,
        pickup: trip.pickupLocation,
        dropoff: trip.dropoffLocation,
      }),
    });
  }, [trip, t]);

  const openContactUrl = React.useCallback(async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('active_trip.contact_unavailable_title'), t('active_trip.contact_unavailable_message'));
      return;
    }

    await Linking.openURL(url);
    setContactOpen(false);
  }, [t]);

  const handleCallContact = React.useCallback(async () => {
    if (!contactPhone) {
      Alert.alert(t('active_trip.call_unavailable_title'), t('active_trip.call_unavailable_message'));
      return;
    }

    await openContactUrl(`tel:${contactPhone}`);
  }, [contactPhone, openContactUrl, t]);

  const handleMessageContact = React.useCallback(async () => {
    if (!contactPhone) {
      Alert.alert(t('active_trip.call_unavailable_title'), t('active_trip.call_unavailable_message'));
      return;
    }

    await openContactUrl(`sms:${contactPhone}`);
  }, [contactPhone, openContactUrl, t]);

  const handleWhatsAppContact = React.useCallback(async () => {
    if (!contactPhone) {
      Alert.alert(t('active_trip.call_unavailable_title'), t('active_trip.call_unavailable_message'));
      return;
    }

    const digits = contactPhone.replace(/[^\d]/g, '');
    await openContactUrl(`https://wa.me/${digits}`);
  }, [contactPhone, openContactUrl, t]);

  const mapBody = MapView ? (
    <MapView style={{ flex: 1 }} region={region}>
      {pickupCoords && Marker ? (
        <Marker
          coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }}
          title={t('book_ride.pickup')}
        />
      ) : null}
      {dropoffCoords && Marker ? (
        <Marker
          coordinate={{ latitude: dropoffCoords.lat, longitude: dropoffCoords.lng }}
          title={t('book_ride.dropoff')}
        />
      ) : null}
      {driverCoords && Marker ? (
        <Marker
          coordinate={{ latitude: driverCoords.lat, longitude: driverCoords.lng }}
          title={t('home.driver')}
        />
      ) : null}
      {Polyline && routeCoords.length === 2 ? (
        <Polyline
          coordinates={routeCoords.map((coord) => ({ latitude: coord.lat, longitude: coord.lng }))}
          strokeColor="#006947"
          strokeWidth={4}
        />
      ) : null}
    </MapView>
  ) : (
    <View className="flex-1 bg-secondary/20 overflow-hidden">
      <View className="absolute inset-0 opacity-60">
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={index}
            className="absolute bg-white/70"
            style={{
              width: index % 2 ? 2 : '120%',
              height: index % 2 ? '120%' : 2,
              left: index % 2 ? `${12 + index * 11}%` : '-10%',
              top: index % 2 ? '-10%' : `${14 + index * 10}%`,
              transform: [{ rotate: index % 2 ? '19deg' : '-12deg' }],
            }}
          />
        ))}
      </View>
      <View className="absolute left-8 right-8 top-1/2 h-1 bg-primary rounded-full" />
      <View className="absolute left-10 top-[46%] bg-primary p-2 rounded-full border-4 border-white">
        <MapPin size={18} color="#fff" />
      </View>
      <View className="absolute right-10 top-[46%] bg-accent p-2 rounded-full border-4 border-white">
        <Navigation size={18} color="#fff" />
      </View>
      <View className="absolute left-[48%] top-[38%] bg-white p-3 rounded-2xl shadow-sm border border-muted/20">
        <Car size={22} color="#006947" />
      </View>
      <View className="absolute left-4 top-4 bg-white/95 px-3 py-2 rounded-2xl border border-muted/20">
        <Text className="text-[10px] font-black uppercase text-muted-foreground">{t('active_trip.live_map')}</Text>
        <Text className="text-xs font-bold text-primary">
          {driverCoords
            ? `${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)}`
            : t('active_trip.waiting_coordinates')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-black text-primary">
              {isDriver ? t('active_trip.active_assignment') : t('active_trip.active_trip')}
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              {trip
                ? `${trip.pickupLocation} -> ${trip.dropoffLocation}`
                : connected ? t('active_trip.tracking_connected') : t('active_trip.connecting')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('active_trip.sos_accessibility')}
            onPress={handleSos}
            disabled={sosSubmitting}
            className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${
              activeAlertId ? 'bg-destructive/40' : 'bg-destructive'
            } ${sosSubmitting ? 'opacity-60' : ''}`}
          >
            <ShieldAlert size={18} color="#fff" />
            <Text className="text-white font-bold">
              {activeAlertId ? t('active_trip.sos_sent_short') : sosSubmitting ? t('active_trip.sending') : 'SOS'}
            </Text>
          </Pressable>
        </View>

        <View className="mx-4 h-72 rounded-3xl overflow-hidden border border-muted/20 bg-card">
          {mapBody}
        </View>

        <View className="mx-4 mt-4 bg-card rounded-3xl p-5 border border-muted/10">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {connected ? t('active_trip.live_tracking') : t('active_trip.connecting_tracking')}
              </Text>
              <Text className="text-xl font-black text-foreground mt-1">
                {trip?.status ? t(`active_trip.status_${trip.status}`, trip.status) : t('active_trip.loading_trip')}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${tripStatusTone(trip?.status).split(' ')[0]}`}>
              <Text className={`text-xs font-black uppercase ${tripStatusTone(trip?.status).split(' ')[1]}`}>
                {trip?.status ?? t('common.loading')}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Metric icon={<Clock size={18} color="#006947" />} label={t('active_trip.eta')} value={t('active_trip.minutes', { count: etaMinutes })} />
            <Metric icon={<Navigation size={18} color="#006947" />} label={t('book_ride.distance')} value={`${remainingKm.toFixed(1)} km`} />
            <Metric icon={<ShieldCheck size={18} color="#006947" />} label={t('book_ride.safety_code')} value={trip?.safetyCode ?? '----'} />
          </View>
        </View>

        <View className="mx-4 mt-4 bg-card rounded-3xl p-5 border border-muted/10">
          <Text className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
            {isDriver ? t('active_trip.rider_details') : t('active_trip.driver_details')}
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-3xl bg-primary/10 items-center justify-center">
              <User size={28} color="#006947" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-foreground">{contactName}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{contactPhone || t('active_trip.phone_pending')}</Text>
              {!isDriver ? (
                <View className="flex-row items-center gap-2 mt-2">
                  <View className="flex-row items-center gap-1">
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    <Text className="text-xs font-black text-foreground">
                      {driverRating != null ? Number(driverRating).toFixed(1) : t('active_trip.rating_pending')}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">
                    {driverCompletedTrips != null
                      ? t('active_trip.completed_trips', { count: driverCompletedTrips })
                      : t('active_trip.trip_history_pending')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={() => setContactOpen(true)}
              className={`w-12 h-12 rounded-2xl items-center justify-center ${contactPhone ? 'bg-primary' : 'bg-muted'}`}
            >
              <Phone size={20} color="#fff" />
            </Pressable>
          </View>
          {!isDriver ? (
            <View className="mt-5 rounded-2xl bg-secondary/25 p-4 border border-muted/10">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center">
                  <Car size={20} color="#006947" />
                </View>
                <View className="flex-1">
                  <Text className="font-black text-foreground">{vehicleName}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">{vehicleMeta || t('active_trip.vehicle_meta_pending')}</Text>
                </View>
                <View className="px-3 py-2 rounded-xl bg-white border border-muted/20">
                  <Text className="text-xs font-black text-primary">{plateNumber}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View className="mx-4 mt-4 bg-card rounded-3xl p-5 border border-muted/10">
          <View className="flex-row items-start gap-3">
            <MapPin size={22} color="#006947" />
            <View className="flex-1">
              <Text className="text-xs font-black uppercase text-muted-foreground">{t('book_ride.pickup')}</Text>
              <Text className="font-bold text-foreground mt-1">{trip?.pickupLocation ?? t('common.loading')}</Text>
              <View className="h-px bg-muted/20 my-4" />
              <Text className="text-xs font-black uppercase text-muted-foreground">{t('book_ride.dropoff')}</Text>
              <Text className="font-bold text-foreground mt-1">{trip?.dropoffLocation ?? t('common.loading')}</Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-4 mb-8 flex-row gap-3">
          {isDriver && driverActionLabel ? (
            <Pressable
              onPress={handleDriverStatus}
              disabled={statusSubmitting}
              className={`flex-1 rounded-2xl py-4 items-center ${statusSubmitting ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="font-black text-white">
                {statusSubmitting ? t('active_trip.updating') : driverActionLabel}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={handleShareTrip}
                className="flex-1 rounded-2xl bg-primary py-4 items-center flex-row justify-center gap-2"
              >
                <Share2 size={18} color="#fff" />
                <Text className="font-black text-white">{t('common.share')}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/trusted-contacts')}
                className="flex-1 rounded-2xl border border-muted/30 py-4 items-center"
              >
                <Text className="font-black text-foreground">{t('active_trip.contacts')}</Text>
              </Pressable>
            </>
          )}
        </View>

        {canCancel ? (
          <Pressable
            onPress={() => setCancelOpen(true)}
            className="mx-4 mb-10 rounded-2xl border border-destructive/20 bg-destructive/5 py-4 items-center"
          >
            <Text className="font-black text-destructive">{t('active_trip.cancel_trip')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal transparent visible={cancelOpen} animationType="fade" onRequestClose={() => setCancelOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-black text-foreground">{t('active_trip.cancel_trip')}</Text>
              <Pressable onPress={() => setCancelOpen(false)} className="p-2">
                <X size={20} color="#1b1b1b" />
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mb-4">{t('active_trip.cancel_prompt')}</Text>
            {CANCEL_REASONS.map((reason) => (
              <Pressable
                key={reason}
                disabled={cancelSubmitting}
                onPress={() => handleCancelTrip(reason)}
                className="py-4 border-b border-muted/10"
              >
                <Text className="font-bold text-foreground">{t(reason)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={contactOpen} animationType="fade" onRequestClose={() => setContactOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-black text-foreground">{t('active_trip.contact_title')}</Text>
              <Pressable onPress={() => setContactOpen(false)} className="p-2">
                <X size={20} color="#1b1b1b" />
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mb-5">{contactName}</Text>
            <ContactAction icon={<Phone size={20} color="#006947" />} title={t('active_trip.call')} subtitle={contactPhone || t('active_trip.phone_pending')} onPress={handleCallContact} />
            <ContactAction icon={<MessageCircle size={20} color="#006947" />} title={t('active_trip.sms')} subtitle={t('active_trip.sms_subtitle')} onPress={handleMessageContact} />
            <ContactAction icon={<MessageCircle size={20} color="#25D366" />} title={t('active_trip.whatsapp')} subtitle={t('active_trip.whatsapp_subtitle')} onPress={handleWhatsAppContact} />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={safetyOpen} animationType="fade" onRequestClose={() => setSafetyOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-black text-foreground">{t('active_trip.verify_safety_code')}</Text>
              <Pressable onPress={() => setSafetyOpen(false)} className="p-2">
                <X size={20} color="#1b1b1b" />
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mb-5">{t('active_trip.verify_safety_code_subtitle')}</Text>
            <TextInput
              value={enteredSafetyCode}
              onChangeText={setEnteredSafetyCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="1234"
              className="h-16 rounded-2xl border border-muted/20 bg-background px-5 text-center text-2xl font-black tracking-widest text-foreground"
            />
            <Pressable
              onPress={submitSafetyCodeAndStart}
              disabled={statusSubmitting || enteredSafetyCode.trim().length < 4}
              className={`mt-5 rounded-2xl py-4 items-center ${statusSubmitting || enteredSafetyCode.trim().length < 4 ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="font-black text-white">{statusSubmitting ? t('active_trip.updating') : t('active_trip.start_trip')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ContactAction({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 py-4 border-b border-muted/10">
      <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="font-black text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground mt-1">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-secondary/25 rounded-2xl p-3">
      <View className="mb-2">{icon}</View>
      <Text className="text-[10px] font-black uppercase text-muted-foreground">{label}</Text>
      <Text className="text-sm font-black text-foreground mt-1">{value}</Text>
    </View>
  );
}

export default withSessionGuard(ActiveTripScreen);
