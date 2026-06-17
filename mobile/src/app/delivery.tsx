import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Package, MapPin, Navigation, Info, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  createDelivery,
  Delivery,
  getDeliveries,
  getDriverDeliveryActionLabel,
  getNextDriverDeliveryStatus,
  getStoredUser,
  isDriverUser,
  updateDeliveryStatus,
} from '../lib/api';
import { PatternOverlay } from '../components/PatternOverlay';
import { withSessionGuard } from '../lib/SessionGuard';

function DeliveryScreen() {
  const { t } = useTranslation();
  const [isDriver, setIsDriver] = React.useState(false);
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [pickup, setPickup] = React.useState('');
  const [dropoff, setDropoff] = React.useState('');
  const [type, setType] = React.useState('DOCUMENT');
  const [weight, setWeight] = React.useState('1');
  const [loading, setLoading] = React.useState(false);
  const [updatingDeliveryId, setUpdatingDeliveryId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [estimate, setEstimate] = React.useState<any>(null);

  const loadDriverDeliveries = React.useCallback(async () => {
    const user = await getStoredUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const driverMode = isDriverUser(user);
    setIsDriver(driverMode);

    if (!driverMode) {
      setDeliveries([]);
      return;
    }

    setError('');
    const items = await getDeliveries(user.id);
    setDeliveries(items);
  }, []);

  React.useEffect(() => {
    loadDriverDeliveries().catch((err) => {
      console.error('Delivery load error:', err);
      setError((err as Error).message);
    });
  }, [loadDriverDeliveries]);

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
        senderId: user.id,
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        packageType: type,
        packageWeightKg: Number(weight),
      });

      Alert.alert('Success', 'Delivery partner has been requested.');
      router.back();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDriverDelivery(delivery: Delivery) {
    const user = await getStoredUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const nextStatus = getNextDriverDeliveryStatus(delivery.status);
    if (!nextStatus) return;

    try {
      setUpdatingDeliveryId(delivery.id);
      await updateDeliveryStatus(delivery.id, nextStatus, user.id);
      await loadDriverDeliveries();
    } catch (err) {
      Alert.alert('Unable to update delivery', (err as Error).message);
    } finally {
      setUpdatingDeliveryId(null);
    }
  }

  const activeDelivery = deliveries.find((delivery) => !['DELIVERED', 'FAILED', 'CANCELLED'].includes(delivery.status));

  if (isDriver) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
            <View className="flex-row items-center mb-8 gap-4">
              <TouchableOpacity onPress={() => router.back()} className="p-3 bg-card rounded-2xl border border-muted/20 shadow-sm">
                <ChevronLeft size={20} color="#006947" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">Assigned Deliveries</Text>
            </View>

            {activeDelivery ? (
              <View className="bg-primary rounded-3xl p-6 shadow-high-tech overflow-hidden relative mb-8">
                <PatternOverlay color="#ffffff" opacity={0.1} />
                <View className="relative z-10 flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Active delivery</Text>
                    <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>{activeDelivery.pickupAddress}</Text>
                    <Text className="text-white/70 text-xs" numberOfLines={1}>To {activeDelivery.dropoffAddress}</Text>
                  </View>
                  <View className="bg-white/15 p-3 rounded-2xl">
                    <Package size={24} color="#ffffff" />
                  </View>
                </View>
              </View>
            ) : null}

            {error ? (
              <View className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10 mb-6">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{error}</Text>
              </View>
            ) : null}

            <View className="space-y-4">
              {deliveries.length === 0 ? (
                <View className="items-center justify-center py-20 bg-card rounded-4xl border border-muted/10 border-dashed">
                  <View className="bg-muted/10 p-6 rounded-full mb-4">
                    <Package size={48} color="#6d7a71" />
                  </View>
                  <Text className="text-lg font-bold text-foreground">No delivery jobs yet</Text>
                  <Text className="mt-2 text-center text-muted-foreground px-10">
                    Assigned parcel work will appear here as soon as dispatch matches it to your account.
                  </Text>
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

                    <View className="space-y-4">
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
                      </View>

                      {getDriverDeliveryActionLabel(delivery.status) ? (
                        <TouchableOpacity
                          onPress={() => handleDriverDelivery(delivery)}
                          disabled={updatingDeliveryId === delivery.id}
                          className={`mt-5 rounded-2xl items-center justify-center py-3 ${updatingDeliveryId === delivery.id ? 'bg-muted' : 'bg-primary'}`}
                        >
                          <Text className="text-white font-bold">
                            {updatingDeliveryId === delivery.id ? 'Updating...' : getDriverDeliveryActionLabel(delivery.status)}
                          </Text>
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

export default withSessionGuard(DeliveryScreen);
