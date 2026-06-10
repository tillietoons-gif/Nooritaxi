import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CheckCircle2, ChefHat, Clock, PackageCheck, ReceiptText, RefreshCw, Truck } from 'lucide-react-native';
import { FoodOrder, FoodOrderStatus, getFoodOrders, getStoredUser } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

const TRACKING_STEPS: FoodOrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STEP_LABEL: Record<FoodOrderStatus, string> = {
  CART: 'Cart',
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready',
  OUT_FOR_DELIVERY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

function stepIcon(status: FoodOrderStatus, active: boolean) {
  const color = active ? '#006947' : '#bccac0';
  if (status === 'PREPARING') return <ChefHat size={16} color={color} />;
  if (status === 'OUT_FOR_DELIVERY') return <Truck size={16} color={color} />;
  if (status === 'DELIVERED') return <PackageCheck size={16} color={color} />;
  return <CheckCircle2 size={16} color={color} />;
}

function FoodOrdersScreen() {
  const [orders, setOrders] = React.useState<FoodOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setOrders(await getFoodOrders({ userId: user.id }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-foreground">Food orders</Text>
              <Text className="text-sm text-muted-foreground mt-1">Track restaurant progress and delivery handoff.</Text>
            </View>
            <TouchableOpacity onPress={loadOrders} className="bg-card border border-muted/20 rounded-full p-3">
              <RefreshCw size={18} color="#006947" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20">
              <ActivityIndicator color="#006947" />
            </View>
          ) : error ? (
            <View className="bg-destructive/5 border border-destructive/10 rounded-3xl p-5">
              <Text className="text-center text-destructive font-bold">{error}</Text>
            </View>
          ) : orders.length === 0 ? (
            <View className="items-center justify-center py-20 bg-card rounded-3xl border border-muted/10 border-dashed">
              <ReceiptText size={42} color="#6d7a71" />
              <Text className="font-bold text-foreground mt-4">No food orders yet</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/food')} className="bg-primary rounded-2xl px-5 py-3 mt-5">
                <Text className="text-white font-bold">Browse restaurants</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => {
              const currentIndex = TRACKING_STEPS.indexOf(order.status);
              return (
                <View key={order.id} className="bg-card rounded-3xl border border-muted/10 p-5 mb-5 shadow-sm">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      <Text className="font-black text-foreground">{order.restaurant?.name ?? 'Restaurant order'}</Text>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <Clock size={12} color="#6d7a71" />
                        <Text className="text-[10px] text-muted-foreground font-bold uppercase">
                          {new Date(order.placedAt ?? order.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-primary">AFN {Number(order.total).toLocaleString()}</Text>
                      <Text className="text-[9px] font-black uppercase text-muted-foreground mt-1">{STEP_LABEL[order.status]}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between gap-2 mb-4">
                    {TRACKING_STEPS.map((step, index) => {
                      const active = order.status === 'DELIVERED' || (currentIndex >= 0 && index <= currentIndex);
                      return (
                        <View key={step} className="items-center flex-1">
                          <View className={`h-8 w-8 rounded-full items-center justify-center ${active ? 'bg-primary/10' : 'bg-muted/20'}`}>
                            {stepIcon(step, active)}
                          </View>
                          <Text className={`text-[9px] font-bold text-center mt-1 ${active ? 'text-primary' : 'text-muted-foreground'}`} numberOfLines={1}>
                            {STEP_LABEL[step]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {order.items?.map((item) => (
                    <View key={item.id} className="flex-row justify-between py-2 border-t border-muted/10">
                      <Text className="text-sm text-foreground flex-1 pr-3">
                        {item.quantity}x {item.menuItem?.name ?? 'Menu item'}
                      </Text>
                      <Text className="text-sm font-bold text-muted-foreground">AFN {Number(item.unitPrice).toLocaleString()}</Text>
                    </View>
                  ))}

                  {order.status === 'DELIVERED' ? (
                    <TouchableOpacity
                      onPress={() => router.push(`/review?targetType=RESTAURANT&orderId=${order.id}&restaurantId=${order.restaurantId}` as any)}
                      className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 py-3 items-center"
                    >
                      <Text className="text-primary font-bold">Review restaurant</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(FoodOrdersScreen);
