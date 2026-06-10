import React from 'react';
import { Alert, Platform, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import { MapPin, ShieldAlert } from 'lucide-react-native';
import {
  AuthUser,
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

function ActiveTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const nativeMaps = React.useMemo(
    () => (Platform.OS === 'web' ? null : require('react-native-maps')),
    [],
  );
  const MapView = nativeMaps?.default;
  const Marker = nativeMaps?.Marker;
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [location, setLocation] = React.useState<DriverLocation | null>(null);
  const [sosSubmitting, setSosSubmitting] = React.useState(false);
  const [statusSubmitting, setStatusSubmitting] = React.useState(false);
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
      if (socketRef.current === nextSocket) {
        socketRef.current = null;
      }
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

  const region = {
    latitude: location?.lat ?? 34.5553,
    longitude: location?.lng ?? 69.2075,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const isDriver = user?.role === 'DRIVER';
  const nextDriverStatus = isDriver ? getNextDriverTripStatus(trip?.status) : null;
  const driverActionLabel = isDriver ? getDriverTripActionLabel(trip?.status) : null;

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

    try {
      setStatusSubmitting(true);
      const updatedTrip = await updateTripStatus(tripId, nextDriverStatus, user.id);
      setTrip(updatedTrip);

      if (updatedTrip.status === 'COMPLETED') {
        Alert.alert(
          'Trip completed',
          'The ride is marked complete and cash collection can now be reconciled.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Unable to update trip',
        err instanceof Error ? err.message : 'Please try again',
      );
    } finally {
      setStatusSubmitting(false);
    }
  }, [tripId, nextDriverStatus, user]);

  const handleSos = React.useCallback(() => {
    if (!tripId || sosSubmitting) return;
    Alert.alert(
      'Trigger SOS?',
      'Your trusted contacts and Noori support will be notified. Use only in an emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
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
                'SOS sent',
                `${result.notifiedContacts} trusted contact(s) notified.${
                  result.shareUrl ? `\n\nShare link: ${result.shareUrl}` : ''
                }`,
              );
            } catch (err) {
              Alert.alert(
                'SOS failed',
                err instanceof Error ? err.message : 'Please try again',
              );
            } finally {
              setSosSubmitting(false);
            }
          },
        },
      ],
    );
  }, [tripId, location, sosSubmitting]);

  return (
    <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-5 border-b border-muted/20 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-primary">{isDriver ? 'Active Assignment' : 'Active Trip'}</Text>
            <Text className="text-muted-foreground text-sm">
              {trip
                ? `${trip.pickupLocation} -> ${trip.dropoffLocation}`
                : connected ? 'Tracking connected' : 'Connecting to tracking…'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Trigger SOS"
            onPress={handleSos}
            disabled={sosSubmitting}
            className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${
              activeAlertId ? 'bg-destructive/40' : 'bg-destructive'
            } ${sosSubmitting ? 'opacity-60' : ''}`}
          >
            <ShieldAlert size={18} color="#fff" />
            <Text className="text-white font-bold">
              {activeAlertId ? 'SOS sent' : sosSubmitting ? 'Sending…' : 'SOS'}
            </Text>
          </Pressable>
        </View>

        {MapView ? (
          <MapView style={{ flex: 1 }} region={region}>
            {location && Marker ? (
              <Marker
                coordinate={{ latitude: location.lat, longitude: location.lng }}
                title="Driver"
              />
            ) : null}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center bg-muted/20 px-6">
            <MapPin size={32} color="#006947" />
            <Text className="mt-4 text-lg font-semibold text-primary">Map unavailable on web preview</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Use the mobile app to see the live trip map. Driver coordinates will still update below.
            </Text>
          </View>
        )}

        <View className="absolute left-4 right-4 bottom-6 bg-card rounded-2xl p-5 border border-muted/10">
          <View className="flex-row items-center gap-3">
            <MapPin size={24} color="#006947" />
            <View className="flex-1">
              <Text className="font-bold">
                {isDriver
                  ? trip?.status ?? 'Waiting for assignment details'
                  : location ? 'Driver location live' : 'Waiting for driver coordinates'}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {isDriver && trip
                  ? `${trip.pickupLocation} -> ${trip.dropoffLocation}`
                  : location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : `Trip ${tripId}`}
              </Text>
            </View>
            {isDriver && driverActionLabel ? (
              <Pressable
                onPress={handleDriverStatus}
                disabled={statusSubmitting}
                className={`rounded-md px-3 py-2 ${statusSubmitting ? 'bg-muted' : 'bg-primary'}`}
              >
                <Text className="text-xs font-bold text-white">
                  {statusSubmitting ? 'Updating...' : driverActionLabel}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push('/trusted-contacts')}
                className="rounded-md border border-muted/30 px-3 py-2"
              >
                <Text className="text-xs">Manage contacts</Text>
              </Pressable>
            )}
          </View>
        </View>
    </SafeAreaView>
  );
}

export default withSessionGuard(ActiveTripScreen);
