import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BriefcaseBusiness, Car, CheckCircle2, ChevronRight, Clock, MapPin, Package } from 'lucide-react-native';
import {
  AuthUser,
  Delivery,
  getDeliveries,
  getDriverDeliveryActionLabel,
  getDriverTripActionLabel,
  getNextDriverDeliveryStatus,
  getNextDriverTripStatus,
  getStoredUser,
  getTrips,
  isDriverUser,
  Trip,
  updateDeliveryStatus,
  updateTripStatus,
} from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';
import { buildDriverWorkSummary } from '../../lib/driver-work';

export default function WorkScreen() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const loadWork = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const storedUser = await getStoredUser();
      if (!storedUser) {
        router.replace('/(auth)/login');
        return;
      }

      if (!isDriverUser(storedUser)) {
        router.replace('/(tabs)/home');
        return;
      }

      setUser(storedUser);
      const [nextTrips, nextDeliveries] = await Promise.all([
        getTrips(storedUser.id),
        getDeliveries(storedUser.id),
      ]);
      setTrips(nextTrips);
      setDeliveries(nextDeliveries);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWork();
    }, [loadWork]),
  );

  async function handleTripAction(trip: Trip) {
    if (!user) return;

    const nextStatus = getNextDriverTripStatus(trip.status);
    if (!nextStatus) return;

    try {
      setUpdatingId(trip.id);
      await updateTripStatus(trip.id, nextStatus, user.id);
      await loadWork();
    } catch (err) {
      Alert.alert('Unable to update trip', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeliveryAction(delivery: Delivery) {
    if (!user) return;

    const nextStatus = getNextDriverDeliveryStatus(delivery.status);
    if (!nextStatus) return;

    try {
      setUpdatingId(delivery.id);
      await updateDeliveryStatus(delivery.id, nextStatus, user.id);
      await loadWork();
    } catch (err) {
      Alert.alert('Unable to update delivery', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setUpdatingId(null);
    }
  }

  const workSummary = buildDriverWorkSummary(trips, deliveries);
  const activeTrips = workSummary.activeTrips;
  const activeDeliveries = workSummary.activeDeliveries;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="bg-primary rounded-3xl p-6 overflow-hidden relative shadow-high-tech mb-8">
            <PatternOverlay color="#ffffff" opacity={0.08} />
            <View className="relative z-10 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Driver work</Text>
                <Text className="text-white text-2xl font-black mb-2">All active assignments in one place</Text>
                <Text className="text-white/80 leading-6">
                  {workSummary.activeTripCount} trip jobs and {workSummary.activeDeliveryCount} delivery jobs currently need attention.
                </Text>
              </View>
              <View className="bg-white/15 p-3 rounded-2xl">
                <BriefcaseBusiness size={24} color="#ffffff" />
              </View>
            </View>
          </View>

          {loading ? (
            [1, 2, 3].map((item) => (
              <View key={item} className="h-32 bg-card border border-muted/10 rounded-3xl mb-4 opacity-50" />
            ))
          ) : error ? (
            <View className="bg-destructive/5 p-6 rounded-3xl border border-destructive/10">
              <Text className="text-destructive font-bold text-center">{error}</Text>
            </View>
          ) : (
            <>
              <Text className="text-lg font-bold text-foreground mb-4">Trip assignments</Text>
              {trips.length === 0 ? (
                <View className="items-center justify-center py-12 bg-card rounded-4xl border border-muted/10 border-dashed mb-8">
                  <Car size={40} color="#6d7a71" />
                  <Text className="text-base font-bold text-foreground mt-4">No trip assignments yet</Text>
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
                          <Text className="font-bold text-foreground text-base">Assigned ride</Text>
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

                    {getDriverTripActionLabel(trip.status) ? (
                      <TouchableOpacity
                        onPress={() => handleTripAction(trip)}
                        disabled={updatingId === trip.id}
                        className={`mt-5 rounded-2xl items-center justify-center py-3 ${updatingId === trip.id ? 'bg-muted' : 'bg-primary'}`}
                      >
                        <Text className="text-white font-bold">
                          {updatingId === trip.id ? 'Updating...' : getDriverTripActionLabel(trip.status)}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}

              <Text className="text-lg font-bold text-foreground mb-4 mt-2">Delivery assignments</Text>
              {deliveries.length === 0 ? (
                <View className="items-center justify-center py-12 bg-card rounded-4xl border border-muted/10 border-dashed">
                  <Package size={40} color="#6d7a71" />
                  <Text className="text-base font-bold text-foreground mt-4">No delivery assignments yet</Text>
                </View>
              ) : (
                deliveries.map((delivery) => (
                  <View key={delivery.id} className="bg-card p-6 rounded-3xl border border-muted/10 mb-5 shadow-sm">
                    <View className="flex-row justify-between items-start mb-6">
                      <View className="flex-row items-center gap-3">
                        <View className="bg-primary/10 p-3 rounded-2xl">
                          <Package size={20} color="#006947" />
                        </View>
                        <View>
                          <Text className="font-bold text-foreground text-base">Delivery job</Text>
                          <Text className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                            {new Date(delivery.requestedAt ?? delivery.createdAt ?? Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-lg text-foreground">AFN {Number(delivery.fee ?? 0).toLocaleString()}</Text>
                        <Text className="text-[9px] font-black uppercase text-muted-foreground mt-1">{delivery.status}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-start gap-4">
                      <View className="items-center">
                        <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <View className="w-[1px] h-6 bg-muted/30 my-1" />
                        <MapPin size={12} color="#D4AF37" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted-foreground font-medium mb-0.5">Pickup</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={2}>{delivery.pickupAddress}</Text>
                        <View className="h-4" />
                        <Text className="text-xs text-muted-foreground font-medium mb-0.5">Dropoff</Text>
                        <Text className="text-sm font-bold text-foreground" numberOfLines={2}>{delivery.dropoffAddress}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push('/delivery')}
                        className="self-center bg-muted/10 p-3 rounded-2xl"
                      >
                        <ChevronRight size={20} color="#bccac0" />
                      </TouchableOpacity>
                    </View>

                    {getDriverDeliveryActionLabel(delivery.status) ? (
                      <TouchableOpacity
                        onPress={() => handleDeliveryAction(delivery)}
                        disabled={updatingId === delivery.id}
                        className={`mt-5 rounded-2xl items-center justify-center py-3 ${updatingId === delivery.id ? 'bg-muted' : 'bg-primary'}`}
                      >
                        <Text className="text-white font-bold">
                          {updatingId === delivery.id ? 'Updating...' : getDriverDeliveryActionLabel(delivery.status)}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}