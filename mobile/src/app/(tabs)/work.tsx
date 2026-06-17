import React from 'react';
import { Alert, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { BriefcaseBusiness, Car, CheckCircle2, ChevronRight, Clock, MapPin, Navigation, Package, X } from 'lucide-react-native';
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
  updateMyDriverStatus,
  updateTripStatus,
} from '../../lib/api';
import { startBackgroundLocation, stopBackgroundLocation } from '../../lib/background-location';
import { PatternOverlay } from '../../components/PatternOverlay';
import { buildDriverWorkSummary } from '../../lib/driver-work';

export default function WorkScreen() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(false);
  const [availabilityUpdating, setAvailabilityUpdating] = React.useState(false);
  const [handledJobIds, setHandledJobIds] = React.useState<string[]>([]);
  const [requestSeconds, setRequestSeconds] = React.useState(30);

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

  React.useEffect(() => {
    if (!online || !user) return;

    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    async function publishAvailability() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      const current = await Location.getCurrentPositionAsync({}).catch(() => null);
      if (current) {
        await updateMyDriverStatus({
          status: 'ONLINE',
          lat: current.coords.latitude,
          lng: current.coords.longitude,
        }).catch(() => undefined);
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 15000,
        },
        (position) => {
          updateMyDriverStatus({
            status: 'ONLINE',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }).catch(() => undefined);
        },
      );
    }

    void publishAvailability();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [online, user]);

  async function handleAvailabilityChange(nextOnline: boolean) {
    try {
      setAvailabilityUpdating(true);
      let coords: { lat?: number; lng?: number } = {};
      if (nextOnline) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location required', 'Drivers need location access to go online for dispatch.');
          return;
        }
        const current = await Location.getCurrentPositionAsync({});
        coords = { lat: current.coords.latitude, lng: current.coords.longitude };
      }

      await updateMyDriverStatus({
        status: nextOnline ? 'ONLINE' : 'OFFLINE',
        ...coords,
      });
      setOnline(nextOnline);

      // Background location for continuous tracking while online
      if (nextOnline) {
        await startBackgroundLocation();
      } else {
        await stopBackgroundLocation();
      }
    } catch (err) {
      Alert.alert('Unable to update availability', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setAvailabilityUpdating(false);
    }
  }

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
  const nextTripRequest = trips.find((trip) => trip.status === 'ACCEPTED' && !handledJobIds.includes(`trip:${trip.id}`));
  const nextDeliveryRequest = deliveries.find((delivery) => delivery.status === 'ASSIGNED' && !handledJobIds.includes(`delivery:${delivery.id}`));
  const jobRequest = nextTripRequest
    ? { type: 'trip' as const, id: nextTripRequest.id, title: 'New ride request', pickup: nextTripRequest.pickupLocation, dropoff: nextTripRequest.dropoffLocation, amount: Number(nextTripRequest.fare ?? 0), item: nextTripRequest }
    : nextDeliveryRequest
      ? { type: 'delivery' as const, id: nextDeliveryRequest.id, title: 'New delivery request', pickup: nextDeliveryRequest.pickupAddress, dropoff: nextDeliveryRequest.dropoffAddress, amount: Number(nextDeliveryRequest.fee ?? 0), item: nextDeliveryRequest }
      : null;
  const activeTrips = workSummary.activeTrips;
  const activeDeliveries = workSummary.activeDeliveries;
  const completedTripCash = trips
    .filter((trip) => trip.status === 'COMPLETED')
    .reduce((sum, trip) => sum + Number(trip.fare ?? 0), 0);
  const completedDeliveryCash = deliveries
    .filter((delivery) => delivery.status === 'DELIVERED')
    .reduce((sum, delivery) => sum + Number(delivery.fee ?? 0), 0);
  const cashTotal = completedTripCash + completedDeliveryCash;

  React.useEffect(() => {
    if (!jobRequest) return;
    setRequestSeconds(30);
    const timer = setInterval(() => {
      setRequestSeconds((seconds) => {
        if (seconds <= 1) {
          setHandledJobIds((current) => [...current, `${jobRequest.type}:${jobRequest.id}`]);
          clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [jobRequest?.id, jobRequest?.type]);

  async function acceptJobRequest() {
    if (!jobRequest) return;
    setHandledJobIds((current) => [...current, `${jobRequest.type}:${jobRequest.id}`]);
    if (jobRequest.type === 'trip') {
      router.push(`/active-trip?tripId=${jobRequest.id}` as any);
    }
  }

  async function declineJobRequest() {
    if (!user || !jobRequest) return;
    try {
      setUpdatingId(jobRequest.id);
      if (jobRequest.type === 'trip') {
        await updateTripStatus(jobRequest.id, 'CANCELLED', user.id);
      } else {
        await updateDeliveryStatus(jobRequest.id, 'CANCELLED', user.id);
      }
      setHandledJobIds((current) => [...current, `${jobRequest.type}:${jobRequest.id}`]);
      await loadWork();
    } catch (err) {
      Alert.alert('Unable to decline job', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setUpdatingId(null);
    }
  }

  if (!loading && jobRequest) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <View className="flex-1 px-6 py-8 justify-between">
          <View className="items-end">
            <View className="h-14 w-14 rounded-full bg-white/15 items-center justify-center">
              <Text className="text-white text-xl font-black">{requestSeconds}</Text>
            </View>
          </View>
          <View>
            <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-3">Dispatch</Text>
            <Text className="text-white text-4xl font-black mb-3">{jobRequest.title}</Text>
            <Text className="text-white/75 text-base leading-6">Review the route and choose quickly so customers know who is coming.</Text>
          </View>
          <View className="bg-white rounded-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center">
                  {jobRequest.type === 'trip' ? <Car size={22} color="#006947" /> : <Package size={22} color="#006947" />}
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground font-bold uppercase">Cash fare</Text>
                  <Text className="text-2xl font-black text-foreground">AFN {jobRequest.amount.toLocaleString()}</Text>
                </View>
              </View>
              <View className="rounded-full bg-accent/15 px-3 py-1">
                <Text className="text-[10px] font-black uppercase text-foreground">{jobRequest.type}</Text>
              </View>
            </View>
            <View className="flex-row gap-4 mb-8">
              <View className="items-center pt-1">
                <MapPin size={16} color="#006947" />
                <View className="w-[1px] flex-1 min-h-10 bg-muted/30 my-2" />
                <Navigation size={16} color="#D4AF37" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground font-bold">Pickup</Text>
                <Text className="text-base font-black text-foreground mb-4">{jobRequest.pickup}</Text>
                <Text className="text-xs text-muted-foreground font-bold">Dropoff</Text>
                <Text className="text-base font-black text-foreground">{jobRequest.dropoff}</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={declineJobRequest}
                disabled={updatingId === jobRequest.id}
                className="h-14 w-16 rounded-2xl bg-destructive/10 items-center justify-center"
              >
                <X size={22} color="#ba1a1a" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={acceptJobRequest}
                className="h-14 flex-1 rounded-2xl bg-primary items-center justify-center"
              >
                <Text className="text-white font-black uppercase tracking-widest">Accept Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

          <View className="bg-card rounded-3xl p-5 border border-muted/10 shadow-sm mb-6">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dispatch availability</Text>
                <Text className="text-lg font-black text-foreground mt-1">
                  {online ? 'Online for nearby jobs' : 'Offline'}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  {online ? 'Your location is updating for ride and delivery matching.' : 'Turn on when you are ready to accept work.'}
                </Text>
              </View>
              <Switch
                value={online}
                disabled={availabilityUpdating}
                onValueChange={handleAvailabilityChange}
              />
            </View>
          </View>

          <View className="bg-secondary/35 rounded-3xl p-5 border border-accent/10 mb-6">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cash reconciliation</Text>
            <Text className="text-2xl font-black text-foreground mt-1">AFN {cashTotal.toLocaleString()}</Text>
            <Text className="text-xs text-muted-foreground mt-2">
              Completed rides: AFN {completedTripCash.toLocaleString()} · Completed deliveries: AFN {completedDeliveryCash.toLocaleString()}
            </Text>
            <TouchableOpacity onPress={() => router.push('/cash-ledger')} className="mt-4 rounded-2xl bg-card border border-muted/10 py-3 items-center">
              <Text className="text-primary font-black uppercase tracking-widest text-xs">Open ledger</Text>
            </TouchableOpacity>
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
