import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2, Plus, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { withSessionGuard } from '../lib/SessionGuard';
import { getStoredUser, placeFoodOrder } from '../lib/api';
import { safeBack } from '../lib/navigation';

// Simple cart screen. In a full app, this would use global state/context or AsyncStorage.
// For demo, accepts cart data via params (JSON string) from restaurant screen.
function CartScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ restaurantId?: string; cartData?: string; restaurantName?: string }>(); 
  const [cart, setCart] = React.useState<Map<string, { name: string; price: number; quantity: number }>>(new Map());
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (params.cartData) {
      try {
        const parsed = JSON.parse(params.cartData);
        const map = new Map();
        Object.entries(parsed).forEach(([id, item]: any) => {
          map.set(id, item);
        });
        setCart(map);
      } catch (e) {
        console.error('Failed to parse cart data', e);
      }
    }
  }, [params.cartData]);

  const updateCart = (itemId: string, delta: number) => {
    setCart(prev => {
      const updated = new Map(prev);
      const current = updated.get(itemId);
      if (!current) return prev;

      const nextQty = Math.max(0, current.quantity + delta);
      if (nextQty === 0) {
        updated.delete(itemId);
      } else {
        updated.set(itemId, { ...current, quantity: nextQty });
      }
      return updated;
    });
  };

  const getTotal = () => {
    let total = 0;
    for (const item of cart.values()) {
      total += item.price * item.quantity;
    }
    return total;
  };

  const cartItemsCount = Array.from(cart.values()).reduce((sum, i) => sum + i.quantity, 0);

  async function placeOrder() {
    if (cart.size === 0) return;

    setLoading(true);
    try {
      const user = await getStoredUser();
      if (!user || !params.restaurantId) {
        router.replace('/(auth)/login');
        return;
      }

      const items = Array.from(cart.entries()).map(([menuItemId, item]) => ({
        menuItemId,
        quantity: item.quantity,
      }));

      const order = await placeFoodOrder({
        riderId: user.id,
        restaurantId: params.restaurantId as string,
        items,
        deliveryAddress: 'Current Location',
      });

      // Navigate to checkout with order details
      router.push(
        `/checkout?amount=${order.total ?? getTotal()}&orderId=${order.id}&type=FOOD&currency=AFN`
      );
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border mt-4">
        <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/food')} className="p-3 bg-card rounded-2xl border border-border shadow-premium">
          <ChevronLeft size={20} color="#D4AF37" />
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-black text-foreground uppercase tracking-wide">{t('cart.title', 'Your Cart')}</Text>
          {params.restaurantName && (
            <Text className="text-xs text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">at {params.restaurantName}</Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {cart.size === 0 ? (
          <View className="items-center justify-center py-20 bg-card rounded-4xl border border-border border-dashed shadow-premium">
            <Text className="text-sm font-black text-muted-foreground uppercase tracking-widest">Your cart is empty</Text>
            <TouchableOpacity
              onPress={() => safeBack(router, '/(tabs)/food')}
              className="mt-6 bg-primary px-8 py-3.5 rounded-2xl border border-accent/20 shadow-premium"
            >
              <Text className="text-white font-extrabold uppercase tracking-wider text-xs">Browse Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Array.from(cart.entries()).map(([id, item]) => (
            <View key={id} className="flex-row justify-between items-center bg-card p-5 rounded-3xl mb-4 border border-border shadow-premium">
              <View className="flex-1 pr-3">
                <Text className="font-extrabold text-foreground text-sm uppercase tracking-wide">{item.name}</Text>
                <Text className="text-accent font-black text-xs uppercase mt-1 tracking-wider">AFN {item.price} × {item.quantity}</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => updateCart(id, -1)} className="p-2.5 bg-[#040806] border border-border rounded-full">
                  <Minus size={14} color="#D4AF37" />
                </TouchableOpacity>
                <Text className="font-bold w-6 text-center text-foreground text-sm">{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateCart(id, 1)} className="p-2.5 bg-[#040806] border border-border rounded-full">
                  <Plus size={14} color="#D4AF37" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateCart(id, -item.quantity)} className="p-2.5 ml-2">
                  <Trash2 size={16} color="#E53E3E" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {cart.size > 0 && (
        <View className="p-6 border-t border-border bg-card shadow-premium">
          <View className="flex-row justify-between mb-5 items-center">
            <Text className="text-sm font-black text-muted-foreground uppercase tracking-widest">Total</Text>
            <Text className="text-2xl font-black text-accent tracking-wider">AFN {getTotal()}</Text>
          </View>
          <TouchableOpacity
            onPress={placeOrder}
            disabled={loading}
            className="bg-primary h-16 rounded-3xl items-center justify-center flex-row border border-accent/20 shadow-premium"
          >
            <Text className="text-white text-base font-black uppercase tracking-widest">
              {loading ? 'Placing Order...' : `Place Order • ${cartItemsCount} items`}
            </Text>
          </TouchableOpacity>
          <Text className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-3 font-bold">
            Pay cash on delivery
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default withSessionGuard(CartScreen);
