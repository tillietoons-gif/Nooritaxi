import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Car, MapPin, Navigation, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { bookRide, getRideEstimate, getSavedPlaces, getStoredUser, RideEstimate, SavedPlace } from '../lib/api';
import { PatternOverlay } from '../components/PatternOverlay';
import { withSessionGuard } from '../lib/SessionGuard';

function BookRideScreen() {
  const { t } = useTranslation();
  const [pickupLocation, setPickupLocation] = React.useState('');
  const [dropoffLocation, setDropoffLocation] = React.useState('');
  const [pickupCoords, setPickupCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = React.useState<RideEstimate | null>(null);
  const [savedPlaces, setSavedPlaces] = React.useState<SavedPlace[]>([]);
  const [safetyCode, setSafetyCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const location = await Location.getCurrentPositionAsync({});
        setPickupCoords({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        setPickupLocation('Current Location');
      } catch (e) {
        console.log('Location error:', e);
      }
    })();
  }, []);

  React.useEffect(() => {
    getSavedPlaces().then(setSavedPlaces);
  }, []);

  React.useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(() => {
      getRideEstimate(5, pickupCoords?.lat, pickupCoords?.lng)
        .then(setEstimate)
        .catch(() => setEstimate(null));
    }, 250);

    return () => clearTimeout(timer);
  }, [dropoffLocation, pickupCoords?.lat, pickupCoords?.lng, pickupLocation]);

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
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        distance: estimate?.distance ?? 5,
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
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
          <View className="flex-row items-center mb-8 gap-4">
             <TouchableOpacity onPress={() => router.back()} className="p-3 bg-card rounded-2xl border border-muted/20 shadow-sm">
                <ChevronLeft size={20} color="#006947" />
             </TouchableOpacity>
             <Text className="text-2xl font-bold text-foreground">{t('book_ride.title', 'Book a Ride')}</Text>
          </View>

          <View className="bg-card p-6 rounded-4xl shadow-sm border border-muted/10 mb-8">
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">From</Text>
                <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                  <MapPin size={20} color="#006947" />
                  <TextInput
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder={t('book_ride.pickup_placeholder', 'Pickup location')}
                    className="flex-1 ml-3 text-base font-bold text-foreground"
                  />
                </View>
              </View>

              <View className="h-4 items-center">
                 <View className="w-[1px] h-full bg-muted/30" />
              </View>

              <View>
                <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">To</Text>
                <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                  <Navigation size={20} color="#D4AF37" />
                  <TextInput
                    value={dropoffLocation}
                    onChangeText={setDropoffLocation}
                    placeholder={t('book_ride.destination_placeholder', 'Destination')}
                    className="flex-1 ml-3 text-base font-bold text-foreground"
                  />
                </View>
              </View>
            </View>
          </View>

          {savedPlaces.length ? (
            <View className="mb-8">
              <Text className="text-xs font-black text-muted-foreground uppercase mb-3 ml-1 tracking-widest">Saved places</Text>
              <View className="flex-row flex-wrap gap-2">
                {savedPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    onPress={() => setDropoffLocation(place.address)}
                    className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3"
                  >
                    <Text className="text-primary font-bold">{place.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <View className="bg-primary/5 rounded-3xl border border-primary/10 p-6 mb-8">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="bg-primary/10 p-3 rounded-2xl">
                  <Car size={20} color="#006947" />
                </View>
                <View>
                  <Text className="font-bold text-foreground">{t('book_ride.fare_preview', 'Fare preview')}</Text>
                  <Text className="text-[10px] text-muted-foreground uppercase font-black">Estimate</Text>
                </View>
              </View>
              <Text className="text-2xl font-black text-primary">
                {estimate ? `${estimate.fare.toLocaleString()} ${estimate.currency}` : '---'}
              </Text>
            </View>
            <Text className="text-[10px] text-muted-foreground mt-4 leading-4">
              {t('book_ride.estimate_notice', 'Estimate uses city distance until GPS route is fully calculated.')}
            </Text>
          </View>

          {safetyCode ? (
            <View className="bg-primary rounded-4xl p-8 mb-8 shadow-high-tech overflow-hidden relative">
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

          {message && !safetyCode ? (
            <View className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <Text className="text-primary font-bold text-center text-xs">{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={confirm}
            disabled={loading || !pickupLocation || !dropoffLocation}
            className={`h-16 rounded-3xl items-center justify-center shadow-lg mb-10 ${loading || !pickupLocation || !dropoffLocation ? 'bg-muted shadow-none' : 'bg-primary shadow-primary/30'}`}
          >
            <Text className="text-white text-lg font-black uppercase tracking-widest">
              {loading ? t('book_ride.confirming', 'Confirming...') : t('book_ride.confirm_ride', 'Confirm Ride')}
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(BookRideScreen);
