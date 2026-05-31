import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, MapPin, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getRestaurants, placeFoodOrder, Restaurant, getStoredUser } from '../../lib/api';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [cart, setCart] = React.useState<Map<string, number>>(new Map());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await getRestaurants();
        const found = data.find((r: Restaurant) => r.id === id);
        if (found) {
          setRestaurant(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateCart = (itemId: string, delta: number) => {
    setCart(prev => {
      const updated = new Map(prev);
      const current = updated.get(itemId) || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) updated.delete(itemId);
      else updated.set(itemId, next);
      return updated;
    });
  };

  const getCartTotal = () => {
    if (!restaurant?.menu) return 0;
    let total = 0;
    for (const [itemId, qty] of cart.entries()) {
      const item = restaurant.menu.find((i: any) => i.id === itemId);
      total += item ? Number(item.price) * qty : 0;
    }
    return total;
  };

  async function handlePlaceOrder() {
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const items = Array.from(cart.entries()).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

      const order = await placeFoodOrder({
        customerId: user.id,
        restaurantId: id as string,
        items,
        deliveryAddress: 'Current Location',
      });
      
      router.push(`/checkout?amount=${order.totalAmount}&orderId=${order.id}&type=FOOD`);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#006947" />
        <Text className="mt-4 text-muted-foreground">{t('restaurant.loading', 'Loading menu...')}</Text>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-lg font-bold">{t('restaurant.not_found', 'Restaurant not found')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-2 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const cartItemsCount = Array.from(cart.values()).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="h-60 bg-muted relative">
          {restaurant.imageUrl ? (
            <Image source={{ uri: restaurant.imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-primary/20 items-center justify-center">
              <ShoppingBag size={48} color="#006947" opacity={0.5} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold mb-2 text-foreground">{restaurant.name}</Text>
          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-row items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-lg">
              <Clock size={14} color="#6d7a71" />
              <Text className="text-sm font-medium text-muted-foreground">{restaurant.avgPrepMinutes ?? 30} min</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-lg">
              <MapPin size={14} color="#6d7a71" />
              <Text className="text-sm font-medium text-muted-foreground">{t('restaurant.free_delivery', 'Free Delivery')}</Text>
            </View>
          </View>

          <Text className="text-xl font-bold mb-4">{t('restaurant.menu', 'Menu')}</Text>
          {restaurant.menu?.length === 0 ? (
            <Text className="text-muted-foreground italic">No items available at the moment.</Text>
          ) : (
            restaurant.menu?.map((item: any) => (
              <View key={item.id} className="flex-row py-4 border-b border-muted/10">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-base mb-1 text-foreground">{item.name}</Text>
                  <Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>{item.description}</Text>
                  <Text className="font-bold text-primary">{item.price} AFN</Text>
                </View>
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} className="w-20 h-20 rounded-xl bg-muted mr-4" />
                )}

                <View className="items-center justify-center bg-card rounded-full border border-muted/20 self-center shadow-sm">
                  {cart.get(item.id) ? (
                    <View className="flex-row items-center">
                      <TouchableOpacity onPress={() => updateCart(item.id, -1)} className="p-2">
                        <Minus size={18} color="#006947" />
                      </TouchableOpacity>
                      <Text className="font-bold px-2 w-6 text-center text-foreground">{cart.get(item.id)}</Text>
                      <TouchableOpacity onPress={() => updateCart(item.id, 1)} className="p-2">
                        <Plus size={18} color="#006947" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => updateCart(item.id, 1)} className="p-3">
                      <Plus size={20} color="#006947" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        <View className="h-32" />
      </ScrollView>

      {cartItemsCount > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-muted/20">
          <TouchableOpacity 
            onPress={handlePlaceOrder}
            className="bg-primary h-14 rounded-xl flex-row items-center justify-between px-6 shadow-lg shadow-primary/30"
          >
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{cartItemsCount}</Text>
            </View>
            <Text className="text-white font-bold text-lg">{t('restaurant.view_cart', 'Place Order')}</Text>
            <Text className="text-white font-bold text-lg">{getCartTotal()} AFN</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
