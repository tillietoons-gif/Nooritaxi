import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, MapPin, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { getRestaurant, placeOrder, Restaurant, getStoredUser, API_URL } from '../../lib/api';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = React.useState<any>(null);
  const [cart, setCart] = React.useState<{ [itemId: string]: number }>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/food/restaurants`);
        const data = await res.json();
        const found = data.find((r: any) => r.id === id);
        setRestaurant(found);
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
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[itemId];
      else updated[itemId] = next;
      return updated;
    });
  };

  const getCartTotal = () => {
    if (!restaurant?.menu) return 0;
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = restaurant.menu.find((i: any) => i.id === itemId);
      return total + (item ? Number(item.price) * qty : 0);
    }, 0);
  };

  async function placeOrder() {
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

      const res = await fetch(`${API_URL}/food/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          restaurantId: id,
          items,
          deliveryAddress: 'Current Location', // simplified for demo
        }),
      });

      if (!res.ok) throw new Error('Failed to place order');
      const order = await res.json();
      
      // Navigate to checkout
      router.push(`/checkout?amount=${order.totalAmount}&orderId=${order.id}&type=FOOD`);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  if (loading) {
    return <SafeAreaView className="flex-1 bg-background justify-center items-center"><Text>Loading menu...</Text></SafeAreaView>;
  }

  if (!restaurant) {
    return <SafeAreaView className="flex-1 bg-background justify-center items-center"><Text>Restaurant not found</Text></SafeAreaView>;
  }

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

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
        </View>
        
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold mb-2">{restaurant.name}</Text>
          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-row items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-lg">
              <Clock size={14} color="#6d7a71" />
              <Text className="text-sm font-medium text-muted-foreground">{restaurant.avgPrepMinutes ?? 30} min</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-lg">
              <MapPin size={14} color="#6d7a71" />
              <Text className="text-sm font-medium text-muted-foreground">Free Delivery</Text>
            </View>
          </View>

          <Text className="text-xl font-bold mb-4">Menu</Text>
          {restaurant.menu?.map((item: any) => (
            <View key={item.id} className="flex-row py-4 border-b border-muted/10">
              <View className="flex-1 pr-4">
                <Text className="font-bold text-base mb-1">{item.name}</Text>
                <Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>{item.description}</Text>
                <Text className="font-bold text-primary">{item.price} AFN</Text>
              </View>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} className="w-20 h-20 rounded-xl bg-muted mr-4" />
              )}
              
              <View className="items-center justify-center bg-card rounded-full border border-muted/20 self-center">
                {cart[item.id] ? (
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => updateCart(item.id, -1)} className="p-2">
                      <Minus size={18} color="#006947" />
                    </TouchableOpacity>
                    <Text className="font-bold px-2 w-6 text-center">{cart[item.id]}</Text>
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
          ))}
        </View>
      </ScrollView>

      {cartItemsCount > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-muted/20">
          <TouchableOpacity 
            onPress={placeOrder}
            className="bg-primary h-14 rounded-xl flex-row items-center justify-between px-6 shadow-lg shadow-primary/30"
          >
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{cartItemsCount}</Text>
            </View>
            <Text className="text-white font-bold text-lg">View Cart</Text>
            <Text className="text-white font-bold text-lg">{getCartTotal()} AFN</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
