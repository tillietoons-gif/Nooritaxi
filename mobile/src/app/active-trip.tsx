import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { io, Socket } from 'socket.io-client';
import { MapPin } from 'lucide-react-native';
import { getAuthToken, SOCKET_URL } from '../lib/api';

type DriverLocation = {
  lat: number;
  lng: number;
  timestamp?: string;
};

export default function ActiveTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [connected, setConnected] = React.useState(false);
  const [location, setLocation] = React.useState<DriverLocation | null>(null);

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

      nextSocket.on('connect', () => {
        setConnected(true);
        nextSocket.emit('joinTrip', tripId);
      });
      nextSocket.on('disconnect', () => setConnected(false));
      nextSocket.on('locationUpdated', setLocation);
    }

    connect();
    return () => {
      mounted = false;
      nextSocket?.disconnect();
    };
  }, [tripId]);

  const region = {
    latitude: location?.lat ?? 34.5553,
    longitude: location?.lng ?? 69.2075,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-5 border-b border-muted/20">
        <Text className="text-2xl font-bold text-primary">Active Trip</Text>
        <Text className="text-muted-foreground text-sm">{connected ? 'Tracking connected' : 'Connecting to tracking...'}</Text>
      </View>

      <MapView style={{ flex: 1 }} region={region}>
        {location ? (
          <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} title="Driver" />
        ) : null}
      </MapView>

      <View className="absolute left-4 right-4 bottom-6 bg-card rounded-2xl p-5 border border-muted/10">
        <View className="flex-row items-center gap-3">
          <MapPin size={24} color="#006947" />
          <View>
            <Text className="font-bold">{location ? 'Driver location live' : 'Waiting for driver coordinates'}</Text>
            <Text className="text-xs text-muted-foreground">
              {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : `Trip ${tripId}`}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
