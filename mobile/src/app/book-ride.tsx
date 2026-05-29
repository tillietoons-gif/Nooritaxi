import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Car, MapPin, Navigation, ShieldCheck } from 'lucide-react-native';
import { bookRide, getRideEstimate, getStoredUser, RideEstimate } from '../lib/api';

export default function BookRideScreen() {
  const [pickupLocation, setPickupLocation] = React.useState('');
  const [dropoffLocation, setDropoffLocation] = React.useState('');
  const [estimate, setEstimate] = React.useState<RideEstimate | null>(null);
  const [safetyCode, setSafetyCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        let location = await Location.getCurrentPositionAsync({});
        // Mock reverse geocoding for now. In a real app we'd convert lat/lng to a string.
        setPickupLocation('Current Location');
      } catch (e) {
        console.log('Location error:', e);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(() => {
      getRideEstimate(5).then(setEstimate).catch(() => setEstimate(null));
    }, 250);

    return () => clearTimeout(timer);
  }, [pickupLocation, dropoffLocation]);

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

      const ride = await bookRide({
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        paymentMethod: 'CASH',
      });

      setSafetyCode(ride.safetyCode ?? '');
      setMessage(`Ride requested. Fare: AFN ${Number(ride.fare ?? estimate?.fare ?? 0).toLocaleString()}`);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-4 py-6">
        <Text className="text-2xl font-bold text-primary mb-6">Book a Ride</Text>

        <View className="space-y-4">
          <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
            <MapPin size={20} color="#006947" />
            <TextInput value={pickupLocation} onChangeText={setPickupLocation} placeholder="Pickup location" className="flex-1 ml-3 text-base" />
          </View>
          <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
            <Navigation size={20} color="#6d7a71" />
            <TextInput value={dropoffLocation} onChangeText={setDropoffLocation} placeholder="Destination" className="flex-1 ml-3 text-base" />
          </View>
        </View>

        <View className="bg-card rounded-2xl border border-muted/10 p-5 mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Car size={18} color="#006947" />
              <Text className="font-bold">Fare preview</Text>
            </View>
            <Text className="text-xl font-bold text-primary">
              {estimate ? `${estimate.fare.toLocaleString()} ${estimate.currency}` : 'Enter trip'}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-2">Estimate uses a 5 km city ride until map distance is available.</Text>
        </View>

        {safetyCode ? (
          <View className="bg-primary/10 rounded-2xl p-5 mt-6 flex-row items-center gap-3">
            <ShieldCheck size={24} color="#006947" />
            <View>
              <Text className="text-primary font-bold">Safety code</Text>
              <Text className="text-2xl font-bold text-primary">{safetyCode}</Text>
            </View>
          </View>
        ) : null}

        {message ? <Text className="text-center text-sm text-muted-foreground mt-5">{message}</Text> : null}

        <TouchableOpacity onPress={confirm} disabled={loading || !pickupLocation || !dropoffLocation} className="bg-primary h-14 rounded-xl items-center justify-center mt-8">
          <Text className="text-white text-lg font-bold">{loading ? 'Confirming...' : 'Confirm Ride'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
