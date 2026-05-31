import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { UtensilsCrossed, Star, Clock, ChevronRight, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getRestaurants, Restaurant } from '../../lib/api';

export default function FoodScreen() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const restaurantListRef = useRef<View>(null);

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getRestaurants();
          setRestaurants(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  const scrollToRestaurants = () => {
    scrollRef.current?.scrollTo({ y: 400, animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" ref={scrollRef}>
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-primary">{t('food.title', 'Food Delivery')}</Text>
            <TouchableOpacity className="p-2 bg-muted/20 rounded-full">
              <Search size={20} color="#006947" />
            </TouchableOpacity>
          </View>

          <View className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 mb-8 relative overflow-hidden">
            <View className="relative z-10 w-2/3">
              <Text className="text-xl font-bold text-foreground mb-2">{t('food.hero_heading', 'Hungry?')}</Text>
              <Text className="text-muted-foreground text-sm mb-6">{t('food.hero_subtitle', 'Order from the best restaurants in town.')}</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full self-start shadow-md shadow-primary/20"
                onPress={scrollToRestaurants}
              >
                <Text className="text-white font-bold">{t('food.order_now', 'Order Now')}</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute -right-4 bottom-0 opacity-20">
              <UtensilsCrossed size={120} color="#006947" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">{t('food.featured_restaurants', 'Restaurants')}</Text>
            <TouchableOpacity onPress={scrollToRestaurants}>
              <Text className="text-primary font-bold text-sm">{t('food.see_all', 'See All')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-10">
              <ActivityIndicator color="#006947" />
            </View>
          ) : restaurants.length === 0 ? (
            <View className="items-center py-10 bg-muted/10 rounded-3xl">
              <UtensilsCrossed size={34} color="#6d7a71" />
              <Text className="mt-3 font-bold text-muted-foreground">{t('food.no_restaurants', 'No restaurants available')}</Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
                className="bg-card rounded-3xl overflow-hidden border border-muted/10 shadow-sm mb-4"
              >
                <View className="h-40 bg-primary/10 items-center justify-center relative">
                  {restaurant.imageUrl ? (
                    <Image source={{ uri: restaurant.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <UtensilsCrossed size={40} color="#006947" opacity={0.5} />
                  )}
                  <View className="absolute top-3 right-3 bg-background/90 px-2 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                    <Star size={12} color="#0e9f6e" fill="#0e9f6e" />
                    <Text className="text-xs font-bold">{restaurant.ratingAverage.toFixed(1)}</Text>
                  </View>
                </View>
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-bold text-lg flex-1 text-foreground">{restaurant.name}</Text>
                    <ChevronRight size={18} color="#bccac0" />
                  </View>
                  <Text className="text-muted-foreground text-xs mb-3">{restaurant.cuisineTypes.join(' • ')}</Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                      <Clock size={12} color="#6d7a71" />
                      <Text className="text-xs font-medium text-muted-foreground">{restaurant.avgPrepMinutes ?? 25} min</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                      <Text className="text-xs font-medium text-muted-foreground">{t('food.free_delivery', 'Free Delivery')}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
