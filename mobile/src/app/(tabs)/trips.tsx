import React from 'react';
import { Alert, View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Car, Clock, MapPin, CheckCircle2, Plus, Navigation, ChevronRight } from 'lucide-react-native';
import {
  AuthUser,
  getDriverTripActionLabel,
  getNextDriverTripStatus,
  getStoredUser,
  getTrips,
  Trip,
  isDriverUser,
  updateTripStatus,
} from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function TripsScreen() {
  const { t } = useTranslation();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingTripId, setUpdatingTripId] = React.useState<string | null>(null);

  const loadTrips = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setUser(user);
      setTrips(await getTrips(user.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );

  const isDriver = isDriverUser(user);
  const activeTrip = trips.find((trip) => !['COMPLETED', 'CANCELLED'].includes(trip.status));

  async function handleDriverAction(trip: Trip) {
    if (!user) return;

    const nextStatus = getNextDriverTripStatus(trip.status);
    if (!nextStatus) return;

    try {
      setUpdatingTripId(trip.id);
      await updateTripStatus(trip.id, nextStatus, user.id);
      await loadTrips();
    } catch (err) {
      Alert.alert(
        'Unable to update trip',
        err instanceof Error ? err.message : 'Please try again',
      );
    } finally {
      setUpdatingTripId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-foreground">
              {isDriver ? t('trips.driver_title', 'Assigned Jobs') : t('trips.title', 'Your Trips')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(isDriver ? '/driver-kyc' : '/book-ride')}
              className="bg-primary px-5 py-3 rounded-2xl flex-row items-center gap-2 shadow-sm"
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-bold">
                {isDriver ? t('trips.driver_cta', 'Verification') : t('trips.book', 'Book')}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTrip ? (
            isDriver ? (
              <TouchableOpacity
                onPress={() => router.push(`/active-trip?tripId=${activeTrip.id}` as any)}
                className="bg-primary rounded-3xl p-6 shadow-high-tech overflow-hidden relative mb-8"
              >
                <PatternOverlay color="#ffffff" opacity={0.1} />
                <View className="flex-row items-center justify-between relative z-10">
                  <View className="flex-1 pr-4">
                    <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                      {t('trips.driver_active', 'Active job')}
                    </Text>
                    <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>{activeTrip.pickupLocation}</Text>
                    <Text className="text-white/70 text-xs" numberOfLines={1}>To {activeTrip.dropoffLocation}</Text>
                  </View>
                  <View className="bg-accent p-3 rounded-2xl">
                    <Navigation size={24} color="#002113" />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push(`/active-trip?tripId=${activeTrip.id}` as any)}
                className="bg-primary rounded-3xl p-6 shadow-high-tech overflow-hidden relative mb-8"
              >
                <PatternOverlay color="#ffffff" opacity={0.1} />
                <View className="flex-row items-center justify-between relative z-10">
                  <View className="flex-1 pr-4">
                    <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Ongoing Trip</Text>
                    <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>{activeTrip.pickupLocation}</Text>
                    <Text className="text-white/70 text-xs" numberOfLines={1}>To {activeTrip.dropoffLocation}</Text>
                  </View>
                  <View className="bg-accent p-3 rounded-2xl">
                    <Navigation size={24} color="#002113" />
                  </View>
                </View>
              </TouchableOpacity>
            )
          ) : null}

          <View className="space-y-4">
            {loading ? (
              [1, 2, 3].map((item) => (
                <View key={item} className="h-32 bg-card border border-muted/10 rounded-3xl mb-4 opacity-50" />
              ))
            ) : error ? (
              <View className="bg-destructive/5 p-6 rounded-3xl border border-destructive/10">
                <Text className="text-destructive font-bold text-center">{error}</Text>
              </View>
            ) : trips.length === 0 ? (
              <View className="items-center justify-center py-20 bg-card rounded-4xl border border-muted/10 border-dashed">
                <View className="bg-muted/10 p-6 rounded-full mb-4">
                  <Car size={48} color="#6d7a71" />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  {isDriver ? t('trips.driver_empty_title', 'No assigned jobs yet') : t('trips.no_trips', 'No trips yet')}
                </Text>
                <Text className="mt-2 text-center text-muted-foreground px-10">
                  {isDriver
                    ? t('trips.driver_empty_subtitle', 'Trips and delivery work assigned to your account will appear here.')
                    : t('trips.no_trips_subtitle', 'Book your first Noori ride to see it here.')}
                </Text>
              </View>
            ) : (
              trips.map((trip) => (
                <View key={trip.id} className="bg-card p-6 rounded-3xl border border-muted/10 mb-5 shadow-sm">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 p-3 rounded-2xl">
                        <Car size={20} color="#006947" />
                      </View>
                      <View>
                        <Text className="font-bold text-foreground text-base">
                          {isDriver ? t('trips.driver_card_title', 'Assigned Ride') : t('trips.rider_card_title', 'Trip Ride')}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Clock size={12} color="#6d7a71" />
                          <Text className="text-[10px] text-muted-foreground font-bold uppercase">
                            {new Date(trip.requestedAt ?? trip.createdAt ?? Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-lg text-foreground">AFN {Number(trip.fare ?? 0).toLocaleString()}</Text>
                      <View className={`flex-row items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${trip.status === 'COMPLETED' ? 'bg-success/10' : 'bg-muted/30'}`}>
                        {trip.status === 'COMPLETED' && <CheckCircle2 size={10} color="#15803D" />}
                        <Text className={`text-[9px] font-black uppercase ${trip.status === 'COMPLETED' ? 'text-success' : 'text-muted-foreground'}`}>
                          {trip.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="space-y-4">
                    <View className="flex-row items-start gap-4">
                      <View className="items-center">
                        <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <View className="w-[1px] h-6 bg-muted/30 my-1" />
                        <MapPin size={12} color="#D4AF37" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted-foreground font-medium mb-0.5">Pickup</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{trip.pickupLocation}</Text>
                        <View className="h-4" />
                        <Text className="text-xs text-muted-foreground font-medium mb-0.5">Dropoff</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{trip.dropoffLocation}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/active-trip?tripId=${trip.id}` as any)}
                        className="self-center bg-muted/10 p-3 rounded-2xl"
                      >
                        <ChevronRight size={20} color="#bccac0" />
                      </TouchableOpacity>
                    </View>

                    {isDriver && getDriverTripActionLabel(trip.status) ? (
                      <TouchableOpacity
                        onPress={() => handleDriverAction(trip)}
                        disabled={updatingTripId === trip.id}
                        className={`mt-5 rounded-2xl items-center justify-center py-3 ${updatingTripId === trip.id ? 'bg-muted' : 'bg-primary'}`}
                      >
                        <Text className="text-white font-bold">
                          {updatingTripId === trip.id ? 'Updating...' : getDriverTripActionLabel(trip.status)}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {!isDriver && trip.status === 'COMPLETED' ? (
                      <TouchableOpacity
                        onPress={() => router.push(`/review?targetType=DRIVER&tripId=${trip.id}&targetUserId=${trip.driver?.id ?? ''}` as any)}
                        className="mt-3 rounded-2xl items-center justify-center py-3 border border-primary/15 bg-primary/5"
                      >
                        <Text className="text-primary font-bold">Review driver</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
