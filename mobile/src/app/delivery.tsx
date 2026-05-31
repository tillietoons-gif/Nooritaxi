import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Package, MapPin, Navigation, Info, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, createDelivery } from '../lib/api';
import { PatternOverlay } from '../components/PatternOverlay';

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
      
      await createDelivery({
        customerId: user.id,
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        packageType: type,
        weight: Number(weight),
      });

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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="flex-row items-center mb-8 gap-4">
             <TouchableOpacity onPress={() => router.back()} className="p-3 bg-card rounded-2xl border border-muted/20 shadow-sm">
                <ChevronLeft size={20} color="#006947" />
             </TouchableOpacity>
             <Text className="text-2xl font-bold text-foreground">{t('delivery.title')}</Text>
          </View>

          <View className="bg-card p-6 rounded-4xl shadow-sm border border-muted/10 mb-8">
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">From</Text>
                <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                  <MapPin size={20} color="#006947" />
                  <TextInput value={pickup} onChangeText={setPickup} placeholder={t('delivery.pickup_address')} className="flex-1 ml-3 text-base font-bold text-foreground" />
                </View>
              </View>

              <View className="h-4 items-center">
                 <View className="w-[1px] h-full bg-muted/30" />
              </View>

              <View>
                <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">To</Text>
                <View className="flex-row items-center bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20">
                  <Navigation size={20} color="#D4AF37" />
                  <TextInput value={dropoff} onChangeText={setDropoff} placeholder={t('delivery.dropoff_address')} className="flex-1 ml-3 text-base font-bold text-foreground" />
                </View>
              </View>
            </View>
          </View>

          <Text className="text-xs font-black text-muted-foreground uppercase mb-3 ml-1 tracking-widest">{t('delivery.package_type')}</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {['DOCUMENT', 'PARCEL', 'FOOD'].map((tType) => (
              <TouchableOpacity
                key={tType}
                onPress={() => setType(tType)}
                className={`px-6 py-3 rounded-2xl border ${type === tType ? 'bg-primary border-primary' : 'bg-card border-muted/20 shadow-sm'}`}
              >
                <Text className={`font-bold uppercase text-[10px] tracking-widest ${type === tType ? 'text-white' : 'text-muted-foreground'}`}>{tType}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-black text-muted-foreground uppercase mb-3 ml-1 tracking-widest">{t('delivery.weight')} (kg)</Text>
          <View className="bg-card h-14 px-4 rounded-2xl border border-muted/20 shadow-sm mb-8 justify-center">
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              className="text-base font-bold text-foreground"
            />
          </View>

          {estimate && (
            <View className="bg-primary rounded-4xl p-8 mb-10 shadow-high-tech overflow-hidden relative">
              <PatternOverlay color="#ffffff" opacity={0.1} />
              <View className="relative z-10 flex-row items-center justify-between">
                <View>
                  <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{t('delivery.fare_estimate')}</Text>
                  <Text className="text-3xl font-black text-white">{estimate.fare} {estimate.currency}</Text>
                </View>
                <View className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                   <Package size={32} color="white" />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={submit}
            disabled={loading || !pickup || !dropoff}
            className={`h-16 rounded-3xl items-center justify-center flex-row gap-3 shadow-lg mb-10 ${loading || !pickup || !dropoff ? 'bg-muted' : 'bg-primary shadow-primary/30'}`}
          >
            <Text className="text-white text-lg font-black uppercase tracking-widest">{loading ? t('delivery.submitting') : t('delivery.submit')}</Text>
            {!loading && <ArrowRight size={20} color="white" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
