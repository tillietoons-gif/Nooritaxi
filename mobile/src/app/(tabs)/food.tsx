import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { UtensilsCrossed, Star, Clock, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getRestaurants, Restaurant } from '../../lib/api';

export default function FoodScreen() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = useRef<ScrollView>(null);

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" ref={scrollRef}>
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-primary mb-6">{t('food.title')}</Text>

          <View className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 mb-8 relative overflow-hidden">
            <View className="relative z-10 w-2/3">
              <Text className="text-xl font-bold text-foreground mb-2">{t('food.hero_heading')}</Text>
              <Text className="text-muted-foreground text-sm mb-6">{t('food.hero_subtitle')}</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full self-start"
                onPress={() => scrollRef.current?.scrollTo({ y: 300, animated: true })}
              >
                <Text className="text-white font-bold">{t('food.order_now')}</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute -right-4 bottom-0 opacity-20">
              <UtensilsCrossed size={120} color="#006947" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold">{t('food.featured_restaurants')}</Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold text-sm">{t('food.see_all')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            [1, 2, 3].map((i) => <View key={i} className="h-48 bg-muted/30 rounded-3xl mb-4" />)
          ) : restaurants.length === 0 ? (
            <View className="items-center py-10">
              <UtensilsCrossed size={34} color="#6d7a71" />
              <Text className="mt-3 font-bold text-muted-foreground">{t('food.no_restaurants')}</Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
                className="bg-card rounded-3xl overflow-hidden border border-muted/10 shadow-sm mb-4"
              >
                <View className="h-36 bg-primary/10 items-center justify-center relative">
                  {restaurant.imageUrl ? (
                    <Image source={{ uri: restaurant.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <UtensilsCrossed size={40} color="#006947" />
                  )}
                  <View className="absolute top-3 right-3 bg-background/90 px-2 py-1 rounded-full flex-row items-center gap-1">
                    <Star size={12} color="#0e9f6e" fill="#0e9f6e" />
                    <Text className="text-xs font-bold">{restaurant.ratingAverage.toFixed(1)}</Text>
                  </View>
                </View>
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-bold text-lg flex-1">{restaurant.name}</Text>
                    <ChevronRight size={18} color="#bccac0" />
                  </View>
                  <Text className="text-muted-foreground text-xs mb-3">{restaurant.cuisineTypes.join(' • ')}</Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                      <Clock size={12} color="#6d7a71" />
                      <Text className="text-xs font-medium text-muted-foreground">{restaurant.avgPrepMinutes ?? 25}{t('food.min_suffix')}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                      <Text className="text-xs font-medium text-muted-foreground">{t('food.free_delivery')}</Text>
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
