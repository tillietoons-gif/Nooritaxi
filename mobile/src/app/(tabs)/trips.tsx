import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Car, Clock, MapPin, CheckCircle2, Plus, Navigation } from 'lucide-react-native';
import { getStoredUser, getTrips, Trip } from '../../lib/api';

export default function TripsScreen() {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadTrips = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
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

  const activeTrip = trips.find((trip) => !['COMPLETED', 'CANCELLED'].includes(trip.status));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-6 border-b border-muted/20">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-primary">Your Trips</Text>
          <TouchableOpacity onPress={() => router.push('/book-ride')} className="bg-primary px-4 py-2 rounded-xl flex-row items-center gap-2">
            <Plus size={16} color="white" />
            <Text className="text-white font-bold">Book</Text>
          </TouchableOpacity>
        </View>
        {activeTrip ? (
          <TouchableOpacity onPress={() => router.push(`/active-trip?tripId=${activeTrip.id}`)} className="mt-4 bg-primary/10 rounded-2xl p-4 flex-row items-center justify-between">
            <View>
              <Text className="font-bold text-primary">Track active trip</Text>
              <Text className="text-xs text-muted-foreground">{activeTrip.pickupLocation} to {activeTrip.dropoffLocation}</Text>
            </View>
            <Navigation size={20} color="#006947" />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView className="flex-1 px-4 py-4">
        {loading ? (
          [1, 2, 3].map((item) => <View key={item} className="h-32 bg-muted/30 rounded-2xl mb-4" />)
        ) : error ? (
          <View className="bg-destructive/5 p-5 rounded-2xl"><Text className="text-destructive font-bold">{error}</Text></View>
        ) : trips.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Car size={42} color="#6d7a71" />
            <Text className="mt-4 text-lg font-bold">No trips yet</Text>
            <Text className="mt-1 text-center text-muted-foreground">Book your first Noori ride to see it here.</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} className="bg-card p-5 rounded-2xl border border-muted/10 mb-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="bg-primary/10 p-2 rounded-lg">
                  <Car size={20} color="#006947" />
                </View>
                <View className="items-end">
                  <Text className="font-bold text-base">AFN {Number(trip.fare ?? 0).toLocaleString()}</Text>
                  <View className="flex-row items-center gap-1">
                    <CheckCircle2 size={12} color="#0e9f6e" />
                    <Text className="text-[10px] text-success font-bold uppercase">{trip.status}</Text>
                  </View>
                </View>
              </View>

              <View className="space-y-3">
                <View className="flex-row items-center gap-2">
                  <Clock size={14} color="#6d7a71" />
                  <Text className="text-xs text-muted-foreground">{new Date(trip.requestedAt ?? trip.createdAt ?? Date.now()).toLocaleDateString()}</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <MapPin size={14} color="#006947" className="mt-1" />
                  <Text className="text-sm font-medium flex-1">{trip.pickupLocation} to {trip.dropoffLocation}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
