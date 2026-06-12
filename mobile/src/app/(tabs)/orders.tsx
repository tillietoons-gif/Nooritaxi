import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Clock, MapPin, ReceiptText, RefreshCw, UtensilsCrossed, XCircle } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { getCache, saveCache, ORDERS_CACHE_KEY } from '../../lib/offline-cache';
import {
  FoodOrder,
  FoodOrderStatus,
  getFoodOrders,
  getRestaurants,
  getStoredUser,
  isMerchantUser,
  Restaurant,
  updateFoodOrderStatus,
} from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

const NEXT_ORDER_STATUS: Partial<Record<FoodOrderStatus, FoodOrderStatus>> = {
  PLACED: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
};

const ORDER_ACTION_LABEL: Partial<Record<FoodOrderStatus, string>> = {
  PLACED: 'Accept order',
  ACCEPTED: 'Start preparing',
  PREPARING: 'Ready for pickup',
};

export default function MerchantOrdersScreen() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [orders, setOrders] = React.useState<FoodOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    setError('');
    let usedCache = false;

    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (!isMerchantUser(user)) {
        router.replace('/(tabs)/home');
        return;
      }

      const ownedRestaurants = (await getRestaurants()).filter((restaurant) => restaurant.ownerId === user.id);
      setRestaurants(ownedRestaurants);

      const allOrders = (
        await Promise.all(ownedRestaurants.map((restaurant) => getFoodOrders({ restaurantId: restaurant.id })))
      ).flat();
      setOrders(allOrders);
      await saveCache(ORDERS_CACHE_KEY, allOrders);
    } catch (err) {
      const cached = await getCache<any[]>(ORDERS_CACHE_KEY);
      if (cached) {
        setOrders(cached);
        usedCache = true;
        setError('Offline mode - showing cached orders');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  async function updateOrder(order: FoodOrder, status: FoodOrderStatus) {
    const user = await getStoredUser();
    if (!user) return;

    try {
      setUpdatingId(order.id);
      await updateFoodOrderStatus(order.id, status, user.id);
      await loadOrders();
    } catch (err) {
      Alert.alert('Unable to update order', (err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  }

  const activeOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status));
  const completedToday = orders.filter((order) => order.status === 'DELIVERED').length;
  const deliveredCash = orders
    .filter((order) => order.status === 'DELIVERED')
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="bg-primary rounded-3xl p-6 overflow-hidden relative shadow-high-tech mb-6">
            <PatternOverlay color="#ffffff" opacity={0.08} />
            <View className="relative z-10 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Order queue</Text>
                <Text className="text-white text-2xl font-black mb-2">{activeOrders.length} active orders</Text>
                <Text className="text-white/80 leading-6">
                  {restaurants.length} restaurant profile{restaurants.length === 1 ? '' : 's'} connected. {completedToday} delivered orders in history.
                </Text>
              </View>
              <View className="bg-white/15 p-3 rounded-2xl">
                <ReceiptText size={24} color="#ffffff" />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={loadOrders}
              className="flex-1 bg-card border border-muted/10 rounded-2xl py-3 items-center justify-center flex-row gap-2"
            >
              <RefreshCw size={16} color="#006947" />
              <Text className="font-bold text-primary">Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/merchant')}
              className="flex-1 bg-primary rounded-2xl py-3 items-center justify-center"
            >
              <Text className="font-bold text-white">Menu</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-secondary/35 rounded-3xl p-5 border border-accent/10 mb-6">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cash reconciliation</Text>
            <Text className="text-2xl font-black text-foreground mt-1">AFN {deliveredCash.toLocaleString()}</Text>
            <Text className="text-xs text-muted-foreground mt-2">
              Delivered cash order value. Admin settlements can reconcile payouts and platform commissions.
            </Text>
            <TouchableOpacity onPress={() => router.push('/cash-ledger')} className="mt-4 rounded-2xl bg-card border border-muted/10 py-3 items-center">
              <Text className="text-primary font-black uppercase tracking-widest text-xs">Open ledger</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20">
              <ActivityIndicator color="#006947" />
            </View>
          ) : error ? (
            <View className="bg-destructive/5 p-5 rounded-3xl border border-destructive/10">
              <Text className="text-destructive text-center font-bold">{error}</Text>
            </View>
          ) : restaurants.length === 0 ? (
            <View className="items-center justify-center py-16 bg-card rounded-3xl border border-muted/10 border-dashed">
              <UtensilsCrossed size={42} color="#6d7a71" />
              <Text className="mt-4 font-bold text-foreground">Create your restaurant first</Text>
              <Text className="text-muted-foreground text-center mt-2 px-8">Orders will appear here after your restaurant and menu are set up.</Text>
            </View>
          ) : orders.length === 0 ? (
            <View className="items-center justify-center py-16 bg-card rounded-3xl border border-muted/10 border-dashed">
              <ReceiptText size={42} color="#6d7a71" />
              <Text className="mt-4 font-bold text-foreground">No orders yet</Text>
              <Text className="text-muted-foreground text-center mt-2 px-8">Incoming customer orders will appear in this queue.</Text>
            </View>
          ) : (
            <FlashList
              data={orders}
              estimatedItemSize={220}
              keyExtractor={(item) => item.id}
              renderItem={({ item: order }) => {
                const nextStatus = NEXT_ORDER_STATUS[order.status];
                return (
                  <View className="bg-card rounded-3xl border border-muted/10 p-5 mb-4 shadow-sm">
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1 pr-4">
                        <Text className="font-black text-foreground">Order #{order.id.slice(-6).toUpperCase()}</Text>
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <Clock size={12} color="#6d7a71" />
                          <Text className="text-[10px] text-muted-foreground font-bold uppercase">
                            {new Date(order.placedAt ?? order.createdAt).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-black text-primary">AFN {Number(order.total).toLocaleString()}</Text>
                        <Text className="text-[9px] font-black uppercase text-muted-foreground mt-1">{order.status}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-start gap-3 mb-4">
                      <MapPin size={16} color="#D4AF37" />
                      <Text className="flex-1 text-sm font-medium text-foreground">{order.deliveryAddress}</Text>
                    </View>

                    {order.items?.map((item) => (
                      <View key={item.id} className="flex-row justify-between py-2 border-t border-muted/10">
                        <Text className="text-sm text-foreground flex-1 pr-3">
                          {item.quantity}x {item.menuItem?.name ?? 'Menu item'}
                        </Text>
                        <Text className="text-sm font-bold text-muted-foreground">AFN {Number(item.unitPrice).toLocaleString()}</Text>
                      </View>
                    ))}

                    <View className="flex-row gap-3 mt-4">
                      {nextStatus ? (
                        <TouchableOpacity
                          onPress={() => updateOrder(order, nextStatus)}
                          disabled={updatingId === order.id}
                          className={`flex-1 rounded-2xl py-3 items-center justify-center ${updatingId === order.id ? 'bg-muted' : 'bg-primary'}`}
                        >
                          <Text className="text-white font-bold">
                            {updatingId === order.id ? 'Updating...' : ORDER_ACTION_LABEL[order.status]}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      {['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status) ? (
                        <TouchableOpacity
                          onPress={() => updateOrder(order, 'CANCELLED')}
                          disabled={updatingId === order.id}
                          className="rounded-2xl px-4 py-3 items-center justify-center border border-destructive/15 bg-destructive/5"
                        >
                          <XCircle size={18} color="#ba1a1a" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
