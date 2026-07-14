import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BriefcaseBusiness, Car, Utensils, Package, Banknote, Bell, ChevronRight, User, Search, Shield, Store, ReceiptText, Gift } from 'lucide-react-native';
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
  const { t } = t => ({ t: (k: string, d?: string) => t(k) || d }); // safety helper
  const { t: trans } = useTranslation();
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
  const greeting = new Date().getHours() < 12 ? trans('home.greeting_morning') : trans('home.greeting_evening');

  const activeWorkType = activeTrip ? 'trip' : activeDelivery ? 'delivery' : null;
  const activeWorkTitle = activeTrip
    ? `${activeTrip.pickupLocation} -> ${activeTrip.dropoffLocation}`
    : activeDelivery
      ? `${activeDelivery.pickupAddress} -> ${activeDelivery.dropoffAddress}`
      : trans('home.driver_idle_title', 'No active trip right now');
  const activeWorkStatus = activeTrip?.status ?? activeDelivery?.status ?? trans('home.driver_idle_subtitle', 'New assignments will appear here as soon as dispatch matches you.');
  const activeWorkBadge = activeWorkType === 'trip'
    ? trans('home.driver_active_badge', 'Current assignment')
    : activeWorkType === 'delivery'
      ? trans('home.driver_delivery_badge', 'Current delivery')
      : trans('home.driver_queue_badge', 'Dispatch status');
  const activeWorkSummary = trans(
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
          <View className="px-6 pt-6 pb-2 flex-row justify-between items-center mt-4">
            <View>
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{greeting},</Text>
              <Text className="text-3xl font-black text-foreground mt-1">{user?.name || trans('home.merchant')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              className="bg-card p-3 rounded-full border border-border shadow-premium"
            >
              <Bell size={24} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            <View className="bg-card rounded-3xl p-6 overflow-hidden relative border border-accent/20 shadow-premium">
              <PatternOverlay color="#D4AF37" opacity={0.03} />
              <View className="relative z-10">
                <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">{trans('home.merchant_mode_badge')}</Text>
                <Text className="text-foreground text-2xl font-black mb-3">
                  {primaryRestaurant?.name ?? trans('home.merchant_profile_title')}
                </Text>
                <Text className="text-muted-foreground text-sm leading-6 mb-6">
                  {primaryRestaurant
                    ? trans('home.merchant_profile_subtitle_active', { count: activeOrders.length })
                    : trans('home.merchant_profile_subtitle_empty')}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/merchant')}
                    className="flex-1 bg-primary py-3.5 rounded-2xl items-center justify-center border border-accent/15"
                  >
                    <Text className="text-white font-bold tracking-wider text-xs uppercase">{trans('home.merchant_manage_menu')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/orders')}
                    className="flex-1 bg-secondary py-3.5 rounded-2xl items-center justify-center border border-border"
                  >
                    <Text className="text-foreground font-bold tracking-wider text-xs uppercase">{trans('profile.orders')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {loadError ? (
            <View className="px-6 pb-2">
              <View className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{loadError}</Text>
              </View>
            </View>
          ) : null}

          <View className="px-6 py-2">
            <View className="bg-card rounded-3xl p-6 border border-border shadow-premium">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">{trans('home.today')}</Text>
                  <Text className="text-foreground text-xl font-black leading-7">{trans('home.active_orders', { count: activeOrders.length })}</Text>
                  <Text className="text-xs text-muted-foreground mt-3 font-medium">
                    {trans('home.merchant_today_summary', { restaurants: restaurants.length, orders: completedOrders })}
                  </Text>
                </View>
                <View className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20">
                  <ReceiptText size={24} color="#D4AF37" />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders')}
                className="bg-secondary py-3.5 rounded-2xl items-center justify-center border border-border"
              >
                <Text className="text-foreground font-bold tracking-wider text-xs uppercase">{trans('home.open_order_queue')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-6">
            <Text className="text-lg font-black text-foreground uppercase tracking-widest mb-4">{trans('home.merchant_tools')}</Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/merchant')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-border shadow-premium items-center mb-4"
              >
                <View className="bg-primary/10 p-4 rounded-2xl mb-3 border border-primary/20">
                  <Store size={32} color="#D4AF37" />
                </View>
                <Text className="font-extrabold text-foreground text-center text-sm">{trans('profile.restaurant')}</Text>
                <Text className="text-[10px] text-muted-foreground text-center mt-1 font-semibold uppercase">{trans('home.profile_and_menu')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-border shadow-premium items-center mb-4"
              >
                <View className="bg-primary/10 p-4 rounded-2xl mb-3 border border-primary/20">
                  <ReceiptText size={32} color="#D4AF37" />
                </View>
                <Text className="font-extrabold text-foreground text-center text-sm">{trans('profile.orders')}</Text>
                <Text className="text-[10px] text-muted-foreground text-center mt-1 font-semibold uppercase">{trans('home.accept_and_prepare')}</Text>
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
          <View className="px-6 pt-6 pb-2 flex-row justify-between items-center mt-4">
            <View>
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{greeting},</Text>
              <Text className="text-3xl font-black text-foreground mt-1">{user?.name || trans('home.driver')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              className="bg-card p-3 rounded-full border border-border shadow-premium"
            >
              <Bell size={24} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            <View className="bg-card rounded-3xl p-6 overflow-hidden relative border border-accent/20 shadow-premium">
              <PatternOverlay color="#D4AF37" opacity={0.03} />
              <View className="relative z-10">
                <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">
                  {trans('home.driver_mode_badge', 'Driver mode')}
                </Text>
                <Text className="text-foreground text-2xl font-black mb-3">
                  {trans('home.driver_mode_title', 'Shared driver workspace')}
                </Text>
                <Text className="text-muted-foreground text-sm leading-6 mb-6 font-medium">
                  {trans('home.driver_mode_subtitle', 'Review assigned trips, stay ready for cash collections, and keep your verification current from the same Noori app.')}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/work')}
                    className="flex-1 bg-primary py-3.5 rounded-2xl items-center justify-center border border-accent/15"
                  >
                    <Text className="text-white font-bold tracking-wider text-xs uppercase">{trans('home.driver_jobs_cta', 'View work')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/driver-kyc')}
                    className="flex-1 bg-secondary py-3.5 rounded-2xl items-center justify-center border border-border"
                  >
                    <Text className="text-foreground font-bold tracking-wider text-xs uppercase">{trans('home.driver_verification_cta', 'Verification')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {loadError ? (
            <View className="px-6 pb-2">
              <View className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{loadError}</Text>
              </View>
            </View>
          ) : null}

          <View className="px-6 py-2">
            <View className="bg-card rounded-3xl p-6 border border-border shadow-premium">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">
                    {activeWorkBadge}
                  </Text>
                  <Text className="text-foreground text-xl font-black leading-7">
                    {activeWorkTitle}
                  </Text>
                  <Text className="text-muted-foreground text-sm mt-2 font-medium">
                    {activeWorkStatus}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-3 font-bold uppercase tracking-wide">{activeWorkSummary}</Text>
                  <Text className="text-xs text-accent font-black mt-2">
                    {trans('home.estimated_earnings', { amount: Math.round((completedTrips * 80) + (activeAssignments * 60) + (activeDeliveries * 50)) })}
                  </Text>
                </View>
                <View className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20">
                  {activeWorkType === 'delivery' ? <Package size={24} color="#D4AF37" /> : <Car size={24} color="#D4AF37" />}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push(activeWorkRoute as any)}
                className="bg-secondary py-3.5 rounded-2xl items-center justify-center border border-border"
              >
                <Text className="text-foreground font-bold tracking-wider text-xs uppercase">
                  {trans('home.driver_all_jobs_cta', 'Open all work')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {(activeTrip || activeDelivery) && (
            <View className="px-6 py-2">
              <TouchableOpacity
                onPress={() => router.push('/active-trip' as any)}
                className="bg-card rounded-3xl p-5 border border-primary/30 flex-row items-center shadow-premium"
              >
                <View className="flex-1">
                  <Text className="text-sm font-black text-accent uppercase tracking-wider">{trans('home.live_tracking_active')}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 font-semibold">{trans('home.live_tracking_subtitle')}</Text>
                </View>
                <Car size={24} color="#D4AF37" />
              </TouchableOpacity>
            </View>
          )}

          <View className="px-6 py-6">
            <Text className="text-lg font-black text-foreground uppercase tracking-widest mb-4">{trans('home.driver_tools_title', 'Driver tools')}</Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/work')}
                className="w-full bg-card p-5 rounded-3xl border border-border shadow-premium mb-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4 flex-1 pr-4">
                    <View className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                      <BriefcaseBusiness size={32} color="#D4AF37" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-extrabold text-foreground text-sm uppercase tracking-wider">{trans('home.driver_jobs_title', 'Active work queue')}</Text>
                      <Text className="text-[11px] text-muted-foreground mt-1 font-semibold">
                        {trans('home.driver_work_summary', '{{trips}} trip jobs and {{deliveries}} delivery jobs active', {
                          trips: activeAssignments,
                          deliveries: activeDeliveries,
                        })}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#7C8E84" />
                </View>
              </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/driver-kyc')}
                  className="w-[48%] bg-card p-5 rounded-3xl border border-border shadow-premium items-center mb-4"
                >
                <View className="bg-primary/10 p-4 rounded-2xl mb-3 border border-primary/20">
                    <User size={32} color="#D4AF37" />
                </View>
                  <Text className="font-extrabold text-foreground text-center text-sm">{trans('home.driver_documents_title', 'Verification')}</Text>
                <Text className="text-[10px] text-muted-foreground text-center mt-1 font-semibold uppercase">
                    {trans('home.driver_documents_subtitle', 'Upload and review your driver documents')}
                </Text>
                </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/help-support')}
                className="w-[48%] bg-card p-5 rounded-3xl border border-border shadow-premium items-center mb-4"
              >
                <View className="bg-primary/10 p-4 rounded-2xl mb-3 border border-primary/20">
                  <Shield size={32} color="#D4AF37" />
                </View>
                <Text className="font-extrabold text-foreground text-center text-sm">{trans('home.driver_support_title', 'Support')}</Text>
                <Text className="text-[10px] text-muted-foreground text-center mt-1 font-semibold uppercase">
                  {trans('home.driver_support_subtitle', '{{count}} completed trips so far', { count: completedTrips })}
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
        <View className="px-6 pt-6 pb-2 flex-row justify-between items-center mt-4">
          <View>
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
              {greeting},
            </Text>
            <Text className="text-3xl font-black text-foreground mt-1">
              {user?.name || trans('home.friend')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            className="bg-card p-3 rounded-full border border-border shadow-premium relative"
          >
            <Bell size={24} color="#D4AF37" />
            <View className="absolute top-2.5 right-2.5 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
          </TouchableOpacity>
        </View>

        {/* Cash Payment Notice */}
        <View className="px-6 py-4">
          <View className="bg-card rounded-3xl p-6 border border-accent/20 overflow-hidden relative shadow-premium">
            <PatternOverlay color="#D4AF37" opacity={0.03} />

            <View className="relative z-10">
              <View className="flex-row justify-between items-start mb-5">
                <View className="flex-1 pr-4">
                  <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">{trans('home.wallet_label')}</Text>
                  <Text className="text-foreground text-lg font-black leading-6">{trans('home.cash_note')}</Text>
                </View>
                <View className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20">
                  <Banknote size={24} color="#D4AF37" />
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/book-ride')}
                  className="flex-1 bg-primary py-3.5 rounded-2xl items-center justify-center border border-accent/15"
                >
                  <Text className="text-white font-bold tracking-wider text-xs uppercase">{trans('home.add_money')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/trips')}
                  className="bg-secondary py-3.5 px-5 rounded-2xl items-center justify-center border border-border"
                >
                  <Text className="text-foreground font-bold tracking-wider text-xs uppercase">{trans('home.details')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar / Quick Action */}
        <View className="px-6 py-2">
          <TouchableOpacity
            onPress={() => router.push('/book-ride')}
            className="bg-card flex-row items-center px-5 py-4 rounded-2xl border border-border shadow-premium"
          >
            <Search size={20} color="#7C8E84" />
            <Text className="ml-4 text-muted-foreground font-semibold text-sm tracking-wide">{trans('home.search_placeholder')}</Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid - REDESIGNED BENTO GRID */}
        <View className="px-6 py-6">
          <Text className="text-lg font-black text-foreground uppercase tracking-widest mb-4">{trans('home.services_title')}</Text>

          {/* Bento Box Layout */}
          <View className="flex-row justify-between mb-4">
            {/* Primary Large Bento Card (Taxi) */}
            <TouchableOpacity
              onPress={() => router.push('/book-ride')}
              className="w-[58%] bg-card p-6 rounded-4xl border border-accent/20 shadow-premium justify-between relative overflow-hidden"
              style={{ minHeight: 180 }}
            >
              <PatternOverlay color="#D4AF37" opacity={0.02} />
              <View className="bg-primary/10 p-4 rounded-2xl self-start border border-primary/20">
                <Car size={32} color="#D4AF37" />
              </View>
              <View className="mt-6">
                <Text className="font-extrabold text-foreground text-lg uppercase tracking-wider">{trans('home.taxi_label')}</Text>
                <Text className="text-xs text-muted-foreground mt-1 font-semibold uppercase">{trans('home.taxi_sub')}</Text>
              </View>
            </TouchableOpacity>

            {/* Vertical Stack Bento Column */}
            <View className="w-[38%] justify-between">
              {/* Food Bento Card */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/food')}
                className="bg-card p-4 rounded-3xl border border-border shadow-premium items-center justify-center"
                style={{ height: 86 }}
              >
                <View className="bg-primary/10 p-2 rounded-xl mb-1.5 border border-primary/20">
                  <Utensils size={18} color="#D4AF37" />
                </View>
                <Text className="font-bold text-foreground text-xs tracking-wide uppercase">{trans('home.food_label')}</Text>
              </TouchableOpacity>

              {/* Parcel Bento Card */}
              <TouchableOpacity
                onPress={() => router.push('/delivery')}
                className="bg-card p-4 rounded-3xl border border-border shadow-premium items-center justify-center"
                style={{ height: 86 }}
              >
                <View className="bg-primary/10 p-2 rounded-xl mb-1.5 border border-primary/20">
                  <Package size={18} color="#D4AF37" />
                </View>
                <Text className="font-bold text-foreground text-xs tracking-wide uppercase">{trans('home.parcel_label')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Bento Row */}
          <TouchableOpacity
            onPress={() => router.push('/promotions')}
            className="bg-card p-5 rounded-3xl border border-accent/20 shadow-premium flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-4">
              <View className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                <Gift size={24} color="#D4AF37" />
              </View>
              <View>
                <Text className="font-extrabold text-accent text-sm tracking-wider uppercase">{trans('home.more_title', 'More')}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase">{trans('home.more_sub', 'Promotions & Rewards')}</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {/* How Noori Works */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-black text-foreground uppercase tracking-widest mb-4">{trans('home.how_it_works', 'How Noori Works')}</Text>
          <View className="space-y-4">
            {[
              { num: '1', title: trans('home.step_request', 'Request'), desc: trans('home.step_request_desc', 'Choose ride, delivery or food and confirm your location.') },
              { num: '2', title: trans('home.step_match', 'Match'), desc: trans('home.step_match_desc', 'We instantly connect you with a verified nearby partner.') },
              { num: '3', title: trans('home.step_track', 'Track & Pay'), desc: trans('home.step_track_desc', 'Follow live on the map. Pay cash on arrival or delivery.') },
            ].map((step, idx) => (
              <View key={idx} className="flex-row bg-card p-5 rounded-3xl border border-border shadow-premium mb-4">
                <View className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mr-4 mt-0.5">
                  <Text className="font-black text-accent text-sm">{step.num}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-extrabold text-foreground text-sm uppercase tracking-wide">{step.title}</Text>
                  <Text className="text-muted-foreground text-xs mt-1.5 leading-5 font-semibold">{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Promo / Cultural Banner */}
        <View className="px-6 pb-12">
          <View className="bg-card rounded-3xl p-6 relative overflow-hidden border border-accent/20 shadow-premium">
             <PatternOverlay color="#D4AF37" opacity={0.03} />

             <View className="flex-row justify-between items-center relative z-10">
               <View className="flex-1 pr-4">
                 <Text className="text-accent font-black text-[10px] uppercase tracking-widest mb-1.5">{trans('home.cultural_tip_label')}</Text>
                 <Text className="text-foreground font-black text-lg uppercase tracking-wide mb-2 leading-6">{trans('home.cultural_tip_title')}</Text>
                 <Text className="text-muted-foreground text-xs leading-5 font-semibold">
                   {trans('home.cultural_tip_body')}</Text>
               </View>
               <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center shadow-premium border border-primary/20">
                  <User size={30} color="#D4AF37" />
               </View>
             </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
