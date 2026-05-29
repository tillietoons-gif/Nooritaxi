import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Package, MapPin, Navigation, Info, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, API_URL } from '../lib/api';

export default function DeliveryScreen() {
  const { t } = useTranslation();
  const [pickup, setPickup] = React.useState('');
  const [dropoff, setDropoff] = React.useState('');
  const [type, setType] = React.useState('DOCUMENT');
  const [weight, setWeight] = React.useState('1');
  const [loading, setLoading] = React.useState(false);
  const [estimate, setEstimate] = React.useState<any>(null);

  React.useEffect(() => {
    if (pickup && dropoff) {
      // Mock estimate for demo
      setEstimate({ fare: 150 + Number(weight) * 20, currency: 'AFN' });
    } else {
      setEstimate(null);
    }
  }, [pickup, dropoff, weight]);

  async function submit() {
    try {
      setLoading(true);
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      
      const res = await fetch(`${API_URL}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          packageType: type,
          weight: Number(weight),
        }),
      });

      if (!res.ok) throw new Error('Failed to request delivery');
      
      Alert.alert('Success', 'Delivery partner has been requested.');
      router.back();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-4 py-6">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="bg-primary/10 p-3 rounded-xl">
            <Package size={24} color="#006947" />
          </View>
          <Text className="text-2xl font-bold text-primary">{t('delivery.title')}</Text>
        </View>

        <View className="space-y-4 mb-6">
          <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
            <MapPin size={20} color="#006947" />
            <TextInput value={pickup} onChangeText={setPickup} placeholder={t('delivery.pickup_address')} className="flex-1 ml-3 text-base" />
          </View>
          <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
            <Navigation size={20} color="#6d7a71" />
            <TextInput value={dropoff} onChangeText={setDropoff} placeholder={t('delivery.dropoff_address')} className="flex-1 ml-3 text-base" />
          </View>
        </View>

        <Text className="font-bold mb-3">{t('delivery.package_type')}</Text>
        <View className="flex-row gap-3 mb-6">
          {['DOCUMENT', 'PARCEL', 'FOOD'].map((tType) => (
            <TouchableOpacity 
              key={tType}
              onPress={() => setType(tType)}
              className={`px-4 py-2 rounded-lg border ${type === tType ? 'bg-primary border-primary' : 'bg-transparent border-muted/30'}`}
            >
              <Text className={type === tType ? 'text-white font-bold' : 'text-foreground'}>{tType}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="font-bold mb-3">{t('delivery.weight')}</Text>
        <TextInput 
          value={weight} 
          onChangeText={setWeight} 
          keyboardType="numeric"
          className="bg-muted/30 h-14 px-4 rounded-xl text-base mb-6" 
        />

        {estimate && (
          <View className="bg-primary/5 rounded-2xl p-5 mb-8 border border-primary/10 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted-foreground">{t('delivery.fare_estimate')}</Text>
              <Text className="text-2xl font-bold text-primary mt-1">{estimate.fare} {estimate.currency}</Text>
            </View>
            <Info size={24} color="#006947" opacity={0.5} />
          </View>
        )}

        <TouchableOpacity 
          onPress={submit} 
          disabled={loading || !pickup || !dropoff}
          className={`h-14 rounded-xl items-center justify-center flex-row gap-2 ${pickup && dropoff ? 'bg-primary' : 'bg-primary/50'}`}
        >
          <Text className="text-white text-lg font-bold">{loading ? t('delivery.submitting') : t('delivery.submit')}</Text>
          {!loading && <ArrowRight size={20} color="white" />}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
