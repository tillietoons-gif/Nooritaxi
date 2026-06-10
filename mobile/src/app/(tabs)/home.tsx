import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BriefcaseBusiness, Car, Utensils, Package, Banknote, Bell, ChevronRight, User, Search, Shield, Store, ReceiptText } from 'lucide-react-native';
import {
  getStoredUser,
  AuthUser,
  Delivery,
  getDeliveries,
  getTrips,
  Trip,
  isDriverUser,
  isMerchantUser,
  getRestaurants,
  Restaurant,
  FoodOrder,
  getFoodOrders,
} from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { PatternOverlay } from '../../components/PatternOverlay';
import { buildDriverWorkSummary } from '../../lib/driver-work';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loadError, setLoadError] = useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoadError('');
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        if (isMerchantUser(storedUser)) {
          const ownedRestaurants = (await getRestaurants()).filter((restaurant) => restaurant.ownerId === storedUser.id);
          const restaurantOrders = (
            await Promise.all(ownedRestaurants.map((restaurant) => getFoodOrders({ restaurantId: restaurant.id })))
          ).flat();
          setRestaurants(ownedRestaurants);
          setOrders(restaurantOrders);
          setTrips([]);
          setDeliveries([]);
        } else {
          setTrips(await getTrips(storedUser.id));
          setDeliveries(isDriverUser(storedUser) ? await getDeliveries(storedUser.id) : []);
          setRestaurants([]);
          setOrders([]);
        }
      } else {
        setTrips([]);
        setDeliveries([]);
        setRestaurants([]);
        setOrders([]);
      }
    } catch (err) {
      console.error('Home load error:', err);
      setLoadError((err as Error).message);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const isDriver = isDriverUser(user);
  const isMerchant = isMerchantUser(user);
  const workSummary = buildDriverWorkSummary(trips, deliveries);
  const activeTrip = workSummary.primaryTrip;
  const activeDelivery = workSummary.primaryDelivery;
  const activeAssignments = workSummary.activeTripCount;
  const activeDeliveries = workSummary.activeDeliveryCount;
  const completedTrips = workSummary.completedTripCount;
  const greeting = new Date().getHours() < 12 ? t('home.greeting_morning') : t('home.greeting_evening');

  const activeWorkType = activeTrip ? 'trip' : activeDelivery ? 'delivery' : null;
  const activeWorkTitle = activeTrip
    ? `${activeTrip.pickupLocation} -> ${activeTrip.dropoffLocation}`
    : activeDelivery
      ? `${activeDelivery.pickupAddress} -> ${activeDelivery.dropoffAddress}`
      : t('home.driver_idle_title', 'No active trip right now');
  const activeWorkStatus = activeTrip?.status ?? activeDelivery?.status ?? t('home.driver_idle_subtitle', 'New assignments will appear here as soon as dispatch matches you.');
  const activeWorkBadge = activeWorkType === 'trip'
    ? t('home.driver_active_badge', 'Current assignment')
    : activeWorkType === 'delivery'
      ? t('home.driver_delivery_badge', 'Current delivery')
      : t('home.driver_queue_badge', 'Dispatch status');
  const activeWorkSummary = t(
    'home.driver_work_summary',
    '{{trips}} trip jobs and {{deliveries}} delivery jobs active',
    { trips: activeAssignments, deliveries: activeDeliveries },
  );
  const activeWorkRoute = '/(tabs)/work';

  if (isMerchant) {
    const activeOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status));
    const completedOrders = orders.filter((order) => order.status === 'DELIVERED').length;
    const primaryRestaurant = restaurants[0] ?? null;

    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
            <View>
              <Text className="text-muted-foreground text-sm font-medium">{greeting},</Text>
              <Text className="text-2xl font-bold text-foreground">{user?.name || 'Merchant'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              className="bg-card p-3 rounded-full shadow-sm border border-muted/20"
            >
              <Bell size={24} color="#006947" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            <View className="bg-primary rounded-3xl p-6 overflow-hidden relative shadow-high-tech">
              <PatternOverlay color="#ffffff" opacity={0.08} />
              <View className="relative z-10">
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Merchant mode</Text>
                <Text className="text-white text-2xl font-black mb-3">
                  {primaryRestaurant?.name ?? 'Build your restaurant profile'}
                </Text>
                <Text className="text-white/80 leading-6 mb-6">
                  {primaryRestaurant
                    ? `${activeOrders.length} active orders need attention. Keep your menu current and prepare orders from one workspace.`
                    : 'Create your restaurant and add menu items so customers can order from you.'}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/merchant')}
                    className="flex-1 bg-white py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-primary font-bold">Manage menu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/orders')}
                    className="flex-1 bg-white/10 py-3 rounded-2xl items-center justify-center border border-white/15"
                  >
                    <Text className="text-white font-bold">Orders</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {loadError ? (
            <View className="px-6 pb-2">
              <View className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{loadError}</Text>
              </View>
            </View>
          ) : null}

          <View className="px-6 py-2">
            <View className="bg-card rounded-3xl p-6 border border-muted/20 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2">Today</Text>
                  <Text className="text-foreground text-lg font-bold leading-6">{activeOrders.length} active orders</Text>
                  <Text className="text-xs text-muted-foreground mt-3">
                    {restaurants.length} restaurant profile{restaurants.length === 1 ? '' : 's'} and {completedOrders} delivered orders in history.
                  </Text>
                </View>
                <View className="bg-primary/10 p-3 rounded-2xl">
                  <ReceiptText size={24} color="#006947" />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders')}
                className="bg-secondary/35 py-3 rounded-2xl items-center justify-center border border-accent/10"
              >
                <Text className="text-foreground font-bold">Open order queue</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-6">
            <Text className="text-lg font-bold text-foreground mb-4">Merchant tools</Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/merchant')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
              >
                <View className="bg-primary/10 p-4 rounded-2xl mb-3">
                  <Store size={32} color="#006947" />
                </View>
                <Text className="font-bold text-foreground text-center">Restaurant</Text>
                <Text className="text-xs text-muted-foreground text-center mt-1">Profile and menu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
              >
                <View className="bg-accent/10 p-4 rounded-2xl mb-3">
                  <ReceiptText size={32} color="#D4AF37" />
                </View>
                <Text className="font-bold text-foreground text-center">Orders</Text>
                <Text className="text-xs text-muted-foreground text-center mt-1">Accept and prepare</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isDriver) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
            <View>
              <Text className="text-muted-foreground text-sm font-medium">{greeting},</Text>
              <Text className="text-2xl font-bold text-foreground">{user?.name || 'Driver'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              className="bg-card p-3 rounded-full shadow-sm border border-muted/20"
            >
              <Bell size={24} color="#006947" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            <View className="bg-primary rounded-3xl p-6 overflow-hidden relative shadow-high-tech">
              <PatternOverlay color="#ffffff" opacity={0.08} />
              <View className="relative z-10">
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">
                  {t('home.driver_mode_badge', 'Driver mode')}
                </Text>
                <Text className="text-white text-2xl font-black mb-3">
                  {t('home.driver_mode_title', 'Shared driver workspace')}
                </Text>
                <Text className="text-white/80 leading-6 mb-6">
                  {t('home.driver_mode_subtitle', 'Review assigned trips, stay ready for cash collections, and keep your verification current from the same Noori app.')}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/work')}
                    className="flex-1 bg-white py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-primary font-bold">{t('home.driver_jobs_cta', 'View work')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/driver-kyc')}
                    className="flex-1 bg-white/10 py-3 rounded-2xl items-center justify-center border border-white/15"
                  >
                    <Text className="text-white font-bold">{t('home.driver_verification_cta', 'Verification')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {loadError ? (
            <View className="px-6 pb-2">
              <View className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{loadError}</Text>
              </View>
            </View>
          ) : null}

          <View className="px-6 py-2">
            <View className="bg-card rounded-3xl p-6 border border-muted/20 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2">
                    {activeWorkBadge}
                  </Text>
                  <Text className="text-foreground text-lg font-bold leading-6">
                    {activeWorkTitle}
                  </Text>
                  <Text className="text-muted-foreground text-sm mt-2">
                    {activeWorkStatus}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-3">{activeWorkSummary}</Text>
                </View>
                <View className="bg-primary/10 p-3 rounded-2xl">
                  {activeWorkType === 'delivery' ? <Package size={24} color="#006947" /> : <Car size={24} color="#006947" />}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push(activeWorkRoute as any)}
                className="bg-secondary/35 py-3 rounded-2xl items-center justify-center border border-accent/10"
              >
                <Text className="text-foreground font-bold">
                  {t('home.driver_all_jobs_cta', 'Open all work')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-6">
            <Text className="text-lg font-bold text-foreground mb-4">{t('home.driver_tools_title', 'Driver tools')}</Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/work')}
                className="w-full bg-card p-5 rounded-3xl border border-muted/20 shadow-sm mb-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4 flex-1 pr-4">
                    <View className="bg-primary/10 p-4 rounded-2xl">
                      <BriefcaseBusiness size={32} color="#006947" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-foreground">{t('home.driver_jobs_title', 'Active work queue')}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {t('home.driver_work_summary', '{{trips}} trip jobs and {{deliveries}} delivery jobs active', {
                          trips: activeAssignments,
                          deliveries: activeDeliveries,
                        })}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#6d7a71" />
                </View>
              </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/driver-kyc')}
                  className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
                >
                <View className="bg-accent/10 p-4 rounded-2xl mb-3">
                    <User size={32} color="#D4AF37" />
                </View>
                  <Text className="font-bold text-foreground">{t('home.driver_documents_title', 'Verification')}</Text>
                <Text className="text-xs text-muted-foreground text-center mt-1">
                    {t('home.driver_documents_subtitle', 'Upload and review your driver documents')}
                </Text>
                </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/help-support')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
              >
                <View className="bg-secondary/35 p-4 rounded-2xl mb-3">
                  <Shield size={32} color="#006947" />
                </View>
                <Text className="font-bold text-foreground">{t('home.driver_support_title', 'Support')}</Text>
                <Text className="text-xs text-muted-foreground text-center mt-1">
                  {t('home.driver_support_subtitle', '{{count}} completed trips so far', { count: completedTrips })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        {/* Header Section */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-muted-foreground text-sm font-medium">
              {greeting},
            </Text>
            <Text className="text-2xl font-bold text-foreground">
              {user?.name || 'Friend'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            className="bg-card p-3 rounded-full shadow-sm border border-muted/20"
          >
            <Bell size={24} color="#006947" />
            <View className="absolute top-3 right-3 w-3 h-3 bg-destructive rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* Cash Payment Notice */}
        <View className="px-6 py-4">
          <View className="bg-secondary/35 rounded-3xl p-6 border border-accent/15 overflow-hidden relative">
            <PatternOverlay color="#D4AF37" opacity={0.05} />

            <View className="relative z-10">
              <View className="flex-row justify-between items-start mb-5">
                <View className="flex-1 pr-4">
                  <Text className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">{t('home.wallet_label')}</Text>
                  <Text className="text-foreground text-lg font-bold leading-6">{t('home.cash_note')}</Text>
                </View>
                <View className="bg-accent/10 p-3 rounded-2xl">
                  <Banknote size={24} color="#D4AF37" />
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/book-ride')}
                  className="flex-1 bg-primary py-3 rounded-2xl items-center justify-center"
                >
                  <Text className="text-white font-bold">{t('home.add_money')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/trips')}
                  className="bg-card py-3 px-4 rounded-2xl items-center justify-center border border-muted/20"
                >
                  <Text className="text-foreground font-bold">{t('home.details')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar / Quick Action */}
        <View className="px-6 py-2">
          <TouchableOpacity
            onPress={() => router.push('/book-ride')}
            className="bg-card flex-row items-center px-4 py-4 rounded-2xl border border-muted/30 shadow-sm"
          >
            <Search size={20} color="#6D7A71" />
            <Text className="ml-3 text-muted-foreground font-medium">{t('home.search_placeholder')}</Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <View className="px-6 py-6">
          <Text className="text-lg font-bold text-foreground mb-4">{t('home.services_title')}</Text>
          <View className="flex-row flex-wrap justify-between">

            {/* Taxi Service */}
            <TouchableOpacity
              onPress={() => router.push('/book-ride')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-primary/10 p-4 rounded-2xl mb-3">
                <Car size={32} color="#006947" />
              </View>
              <Text className="font-bold text-foreground">{t('home.taxi_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.taxi_sub')}</Text>
            </TouchableOpacity>

            {/* Food Service */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/food')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-orange-500/10 p-4 rounded-2xl mb-3">
                <Utensils size={32} color="#f97316" />
              </View>
              <Text className="font-bold text-foreground">{t('home.food_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.food_sub')}</Text>
            </TouchableOpacity>

            {/* Parcel Service */}
            <TouchableOpacity
              onPress={() => router.push('/delivery')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-blue-500/10 p-4 rounded-2xl mb-3">
                <Package size={32} color="#3b82f6" />
              </View>
              <Text className="font-bold text-foreground">{t('home.parcel_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.parcel_sub')}</Text>
            </TouchableOpacity>

            {/* More / Cultural Info */}
            <TouchableOpacity
              className="w-[48%] bg-accent/5 p-5 rounded-3xl border border-accent/20 shadow-sm items-center border-dashed mb-4"
            >
              <View className="bg-accent/10 p-4 rounded-2xl mb-3">
                <ChevronRight size={32} color="#D4AF37" />
              </View>
              <Text className="font-bold text-accent">{t('home.more_label')}</Text>
              <Text className="text-xs text-accent/70 text-center mt-1">{t('home.more_sub')}</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Promo / Cultural Banner */}
        <View className="px-6 pb-10">
          <View className="bg-secondary/30 rounded-3xl p-6 relative overflow-hidden border border-accent/10">
             {/* Cultural pattern background */}
             <PatternOverlay color="#D4AF37" opacity={0.04} />

             <View className="flex-row justify-between items-center">
               <View className="flex-1 pr-4">
                 <Text className="text-accent font-bold text-[10px] uppercase tracking-widest mb-1">CULTURAL TIP</Text>
                 <Text className="text-foreground font-bold text-lg mb-2">{t('home.cultural_tip_title')}</Text>
                 <Text className="text-muted-foreground text-xs leading-5">
                   {t('home.cultural_tip_body')}
                 </Text>
               </View>
               <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-sm">
                  <User size={30} color="#D4AF37" />
               </View>
             </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
