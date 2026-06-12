import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { withSessionGuard } from '../lib/SessionGuard';
import { getStoredUser, placeFoodOrder } from '../lib/api';

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
      <View className="px-4 py-4 flex-row items-center border-b border-muted/20">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#006947" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-3 text-foreground">Your Cart</Text>
        {params.restaurantName && (
          <Text className="ml-2 text-muted-foreground">at {params.restaurantName}</Text>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {cart.size === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-lg font-bold text-muted-foreground">Your cart is empty</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 bg-primary px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-bold">Browse Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Array.from(cart.entries()).map(([id, item]) => (
            <View key={id} className="flex-row justify-between items-center bg-card p-4 rounded-3xl mb-3 border border-muted/10">
              <View className="flex-1">
                <Text className="font-bold text-foreground">{item.name}</Text>
                <Text className="text-primary font-bold">AFN {item.price} × {item.quantity}</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => updateCart(id, -1)} className="p-2 bg-muted/20 rounded-full">
                  <Minus size={18} color="#006947" />
                </TouchableOpacity>
                <Text className="font-bold w-6 text-center">{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateCart(id, 1)} className="p-2 bg-muted/20 rounded-full">
                  <Plus size={18} color="#006947" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateCart(id, -item.quantity)} className="p-2">
                  <Trash2 size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {cart.size > 0 && (
        <View className="p-4 border-t border-muted/20 bg-background">
          <View className="flex-row justify-between mb-4">
            <Text className="text-lg font-bold">Total</Text>
            <Text className="text-2xl font-black text-primary">AFN {getTotal()}</Text>
          </View>
          <TouchableOpacity
            onPress={placeOrder}
            disabled={loading}
            className="bg-primary h-14 rounded-2xl items-center justify-center flex-row"
          >
            <Text className="text-white text-lg font-bold">
              {loading ? 'Placing Order...' : `Place Order • ${cartItemsCount} items`}
            </Text>
          </TouchableOpacity>
          <Text className="text-center text-xs text-muted-foreground mt-2">
            Pay cash on delivery
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default withSessionGuard(CartScreen);