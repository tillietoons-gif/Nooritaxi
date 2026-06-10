import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Banknote, Bike, Car, Store } from 'lucide-react-native';
import {
  FoodOrder,
  getDeliveries,
  getFoodOrders,
  getRestaurants,
  getStoredUser,
  getTrips,
  isDriverUser,
  isMerchantUser,
} from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

type LedgerItem = {
  id: string;
  type: 'Ride' | 'Delivery' | 'Food order';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
};

function CashLedgerScreen() {
  const [items, setItems] = React.useState<LedgerItem[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'rides' | 'deliveries' | 'orders'>('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const user = await getStoredUser();
      if (!user) return;

      const nextItems: LedgerItem[] = [];
      if (isDriverUser(user)) {
        const [trips, deliveries] = await Promise.all([getTrips(user.id), getDeliveries(user.id)]);
        trips
          .filter((trip) => trip.status === 'COMPLETED')
          .forEach((trip) => nextItems.push({
            id: `trip:${trip.id}`,
            type: 'Ride',
            title: `${trip.pickupLocation} to ${trip.dropoffLocation}`,
            subtitle: 'Cash collected from rider',
            amount: Number(trip.fare ?? 0),
            date: trip.createdAt ?? trip.requestedAt ?? new Date().toISOString(),
          }));
        deliveries
          .filter((delivery) => delivery.status === 'DELIVERED')
          .forEach((delivery) => nextItems.push({
            id: `delivery:${delivery.id}`,
            type: 'Delivery',
            title: `${delivery.pickupAddress} to ${delivery.dropoffAddress}`,
            subtitle: 'Cash delivery fee collected',
            amount: Number(delivery.fee ?? 0),
            date: delivery.createdAt ?? delivery.requestedAt ?? new Date().toISOString(),
          }));
      }

      if (isMerchantUser(user)) {
        const restaurants = await getRestaurants();
        const owned = restaurants.filter((restaurant) => restaurant.ownerId === user.id);
        const orderGroups = await Promise.all(
          owned.map((restaurant) => getFoodOrders({ restaurantId: restaurant.id }).catch(() => [] as FoodOrder[])),
        );
        orderGroups.flat()
          .filter((order) => order.status === 'DELIVERED')
          .forEach((order) => nextItems.push({
            id: `order:${order.id}`,
            type: 'Food order',
            title: order.restaurant?.name ?? 'Restaurant order',
            subtitle: order.deliveryAddress,
            amount: Number(order.total ?? 0),
            date: order.createdAt ?? order.placedAt ?? new Date().toISOString(),
          }));
      }

      setItems(nextItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }

    load();
  }, []);

  const filtered = items.filter((item) => {
    if (filter === 'rides') return item.type === 'Ride';
    if (filter === 'deliveries') return item.type === 'Delivery';
    if (filter === 'orders') return item.type === 'Food order';
    return true;
  });
  const total = filtered.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="bg-primary rounded-3xl p-6 mb-6">
            <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest">Cash reconciliation</Text>
            <Text className="text-white text-4xl font-black mt-2">AFN {total.toLocaleString()}</Text>
            <Text className="text-white/75 mt-2">Cash collected across completed work and delivered orders.</Text>
          </View>

          <View className="flex-row gap-2 mb-6">
            {[
              ['all', 'All'],
              ['rides', 'Rides'],
              ['deliveries', 'Deliveries'],
              ['orders', 'Orders'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setFilter(value as typeof filter)}
                className={`px-4 py-2 rounded-full border ${filter === value ? 'bg-primary border-primary' : 'bg-card border-muted/20'}`}
              >
                <Text className={`text-xs font-black ${filter === value ? 'text-white' : 'text-foreground'}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View className="py-20"><ActivityIndicator color="#006947" /></View>
          ) : filtered.length === 0 ? (
            <View className="bg-card rounded-3xl border border-muted/10 border-dashed p-10 items-center">
              <Banknote size={42} color="#6d7a71" />
              <Text className="font-bold text-muted-foreground mt-4">No cash ledger entries yet</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <View key={item.id} className="bg-card rounded-2xl border border-muted/10 p-4 mb-3 flex-row items-center gap-3">
                <View className="h-11 w-11 rounded-2xl bg-primary/10 items-center justify-center">
                  {item.type === 'Ride' ? <Car size={20} color="#006947" /> : item.type === 'Delivery' ? <Bike size={20} color="#006947" /> : <Store size={20} color="#006947" />}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-foreground" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>{item.subtitle}</Text>
                  <Text className="text-[10px] text-muted-foreground mt-1">{new Date(item.date).toLocaleDateString()} · {item.type}</Text>
                </View>
                <Text className="font-black text-primary">AFN {item.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(CashLedgerScreen);
