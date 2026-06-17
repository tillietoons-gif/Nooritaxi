import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { UtensilsCrossed, Star, Clock, ChevronRight, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getRestaurants, Restaurant } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

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

  const scrollToRestaurants = () => {
    scrollRef.current?.scrollTo({ y: 400, animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-foreground">{t('food.title', 'Food Delivery')}</Text>
            <TouchableOpacity className="p-3 bg-card border border-muted/20 rounded-full shadow-sm">
              <Search size={20} color="#006947" />
            </TouchableOpacity>
          </View>

          {/* High-Tech Promo Card */}
          <View className="bg-primary p-8 rounded-4xl shadow-high-tech mb-8 relative overflow-hidden">
            <PatternOverlay color="#ffffff" opacity={0.1} />
            <View className="relative z-10 w-2/3">
              <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Promo</Text>
              <Text className="text-2xl font-bold text-white mb-2">{t('food.hero_heading', 'Hungry?')}</Text>
              <Text className="text-white/70 text-xs mb-6 leading-5">{t('food.hero_subtitle', 'Order from the best restaurants in town.')}</Text>
              <TouchableOpacity
                className="bg-accent px-6 py-3 rounded-2xl self-start shadow-sm"
                onPress={scrollToRestaurants}
              >
                <Text className="text-primary-dark font-bold">{t('food.order_now', 'Order Now')}</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute -right-10 -bottom-10 opacity-10">
              <UtensilsCrossed size={200} color="white" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">{t('food.featured_restaurants', 'Restaurants')}</Text>
            <TouchableOpacity onPress={scrollToRestaurants}>
              <Text className="text-primary font-bold text-sm">{t('food.see_all', 'See All')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20">
              <ActivityIndicator color="#006947" />
            </View>
          ) : restaurants.length === 0 ? (
            <View className="items-center py-16 bg-card rounded-3xl border border-muted/10">
              <UtensilsCrossed size={40} color="#6d7a71" />
              <Text className="mt-4 font-bold text-muted-foreground">{t('food.no_restaurants', 'No restaurants available')}</Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
                className="bg-card rounded-4xl overflow-hidden border border-muted/10 shadow-sm mb-6"
              >
                <View className="h-48 bg-primary/5 items-center justify-center relative">
                  {restaurant.imageUrl ? (
                    <Image source={{ uri: restaurant.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <UtensilsCrossed size={48} color="#006947" opacity={0.2} />
                  )}
                  <View className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl flex-row items-center gap-1.5 shadow-sm border border-white/50">
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    <Text className="text-xs font-black text-foreground">{restaurant.ratingAverage.toFixed(1)}</Text>
                  </View>
                </View>
                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                      <Text className="font-bold text-xl text-foreground" numberOfLines={1}>{restaurant.name}</Text>
                      <Text className="text-muted-foreground text-xs mt-0.5">{restaurant.cuisineTypes.join(' • ')}</Text>
                    </View>
                    <View className="bg-primary/10 p-2 rounded-xl">
                       <ChevronRight size={18} color="#006947" />
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3 mt-2">
                    <View className="flex-row items-center gap-1.5 bg-muted/20 px-3 py-2 rounded-2xl">
                      <Clock size={14} color="#6d7a71" />
                      <Text className="text-xs font-bold text-muted-foreground">{restaurant.avgPrepMinutes ?? 25} min</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-success/10 px-3 py-2 rounded-2xl border border-success/10">
                      <Text className="text-xs font-bold text-success uppercase">{t('food.free_delivery', 'Free Delivery')}</Text>
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
