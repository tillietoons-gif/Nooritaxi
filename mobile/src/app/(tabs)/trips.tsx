import React from 'react';
import { Alert, View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Car, Clock, MapPin, CheckCircle2, Plus, Navigation, ChevronRight } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { getCache, saveCache, TRIPS_CACHE_KEY } from '../../lib/offline-cache';
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
  const [isOffline, setIsOffline] = React.useState(false);

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
      const tripsData = await getTrips(user.id);
      setTrips(tripsData);
      await saveCache(TRIPS_CACHE_KEY, tripsData); // save for offline
    } catch (err) {
      // Offline fallback
      const cached = await getCache<any[]>(TRIPS_CACHE_KEY);
      if (cached) {
        setTrips(cached);
        setIsOffline(true);
        setError('Offline mode - showing cached data');
      } else {
        setError((err as Error).message);
      }
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
            <Text className="text-2xl font-black text-foreground uppercase tracking-wider">
              {isDriver ? t('trips.driver_title', 'Assigned Jobs') : t('trips.title', 'Your Trips')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(isDriver ? '/driver-kyc' : '/book-ride')}
              className="bg-primary px-5 py-3 rounded-2xl flex-row items-center gap-2 border border-accent/20 shadow-premium"
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-bold uppercase tracking-wider text-xs">
                {isDriver ? t('trips.driver_cta', 'Verification') : t('trips.book', 'Book')}
              </Text>
            </TouchableOpacity>
          </View>

          {isOffline && (
            <View className="bg-destructive/10 p-3 rounded-2xl mb-4 border border-destructive/20">
              <Text className="text-destructive text-xs text-center font-bold uppercase tracking-widest">Offline - data may be outdated</Text>
            </View>
          )}

          {activeTrip ? (
            <TouchableOpacity
              onPress={() => router.push(`/active-trip?tripId=${activeTrip.id}` as any)}
              className="bg-card border border-accent/20 rounded-3xl p-6 shadow-premium overflow-hidden relative mb-8"
            >
              <PatternOverlay color="#D4AF37" opacity={0.03} />
              <View className="flex-row items-center justify-between relative z-10">
                <View className="flex-1 pr-4">
                  <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-1.5">
                    {isDriver ? t('trips.driver_active', 'Active job') : 'Ongoing Trip'}
                  </Text>
                  <Text className="text-foreground font-black text-lg mb-1" numberOfLines={1}>{activeTrip.pickupLocation}</Text>
                  <Text className="text-muted-foreground text-xs font-semibold" numberOfLines={1}>To {activeTrip.dropoffLocation}</Text>
                </View>
                <View className="bg-primary/20 p-3 rounded-2xl border border-accent/20">
                  <Navigation size={24} color="#D4AF37" />
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          {loading ? (
            <View className="space-y-4">
              {[1, 2, 3].map((item) => (
                <View key={item} className="h-32 bg-card border border-border rounded-3xl mb-4 opacity-50 shadow-premium" />
              ))}
            </View>
          ) : error ? (
            <View className="bg-destructive/10 p-6 rounded-3xl border border-destructive/20">
              <Text className="text-destructive font-bold text-center text-xs uppercase tracking-widest">{error}</Text>
            </View>
          ) : trips.length === 0 ? (
            <View className="items-center justify-center py-20 bg-card rounded-4xl border border-border border-dashed shadow-premium">
              <View className="bg-primary/10 p-6 rounded-full mb-4 border border-primary/20">
                <Car size={48} color="#D4AF37" />
              </View>
              <Text className="text-lg font-black text-foreground uppercase tracking-widest">
                {isDriver ? t('trips.driver_empty_title', 'No assigned jobs yet') : t('trips.no_trips', 'No trips yet')}
              </Text>
              <Text className="mt-3 text-center text-muted-foreground px-10 text-xs leading-5 font-semibold">
                {isDriver
                  ? t('trips.driver_empty_subtitle', 'Trips and delivery work assigned to your account will appear here.')
                  : t('trips.no_trips_subtitle', 'Book your first Noori ride to see it here.')}
              </Text>
            </View>
          ) : (
            <FlashList
              data={trips}
              keyExtractor={(item) => item.id}
              renderItem={({ item: trip }) => (
                <View className="bg-card p-6 rounded-3xl border border-border mb-5 shadow-premium">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                        <Car size={20} color="#D4AF37" />
                      </View>
                      <View>
                        <Text className="font-black text-foreground text-sm uppercase tracking-wider">
                          {isDriver ? t('trips.driver_card_title', 'Assigned Ride') : t('trips.rider_card_title', 'Trip Ride')}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <Clock size={12} color="#7C8E84" />
                          <Text className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                            {new Date(trip.requestedAt ?? trip.createdAt ?? Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-base text-accent">AFN {Number(trip.fare ?? 0).toLocaleString()}</Text>
                      <View className={`flex-row items-center gap-1 mt-1 px-2.5 py-1 rounded-full border border-accent/10 ${trip.status === 'COMPLETED' ? 'bg-success/10' : 'bg-muted/30'}`}>
                        {trip.status === 'COMPLETED' && <CheckCircle2 size={10} color="#00C853" />}
                        <Text className={`text-[9px] font-black uppercase ${trip.status === 'COMPLETED' ? 'text-success' : 'text-muted-foreground'}`}>
                          {trip.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="space-y-4">
                    <View className="flex-row items-start gap-4">
                      <View className="items-center mt-1">
                        <View className="w-2 h-2 rounded-full bg-accent" />
                        <View className="w-[1px] h-6 bg-border my-1.5" />
                        <MapPin size={12} color="#D4AF37" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[9px] text-accent font-black uppercase tracking-widest mb-0.5">Pickup</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{trip.pickupLocation}</Text>
                        <View className="h-4" />
                        <Text className="text-[9px] text-accent font-black uppercase tracking-widest mb-0.5">Dropoff</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{trip.dropoffLocation}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/active-trip?tripId=${trip.id}` as any)}
                        className="self-center bg-[#040806] p-3 rounded-2xl border border-border shadow-premium"
                      >
                        <ChevronRight size={20} color="#D4AF37" />
                      </TouchableOpacity>
                    </View>

                    {isDriver && getDriverTripActionLabel(trip.status) ? (
                      <TouchableOpacity
                        onPress={() => handleDriverAction(trip)}
                        disabled={updatingTripId === trip.id}
                        className={`mt-5 rounded-2xl items-center justify-center py-3.5 ${updatingTripId === trip.id ? 'bg-muted' : 'bg-primary'}`}
                      >
                        <Text className="text-white font-bold uppercase tracking-wider text-xs">
                          {updatingTripId === trip.id ? 'Updating...' : getDriverTripActionLabel(trip.status)}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {!isDriver && trip.status === 'COMPLETED' ? (
                      <TouchableOpacity
                        onPress={() => router.push(`/review?targetType=DRIVER&tripId=${trip.id}&targetUserId=${trip.driver?.id ?? ''}` as any)}
                        className="mt-4 rounded-2xl items-center justify-center py-3.5 border border-primary/20 bg-primary/10"
                      >
                        <Text className="text-accent font-extrabold uppercase tracking-wider text-xs">Review driver</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
