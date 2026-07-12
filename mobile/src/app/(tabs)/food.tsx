import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { UtensilsCrossed, Star, Clock, ChevronRight, Search, ReceiptText } from 'lucide-react-native';
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
            <Text className="text-2xl font-black text-foreground uppercase tracking-wider">{t('food.title', 'Food Delivery')}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push('/food-orders')}
                className="p-3 bg-card border border-border rounded-full shadow-premium"
              >
                <ReceiptText size={20} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity className="p-3 bg-card border border-border rounded-full shadow-premium">
                <Search size={20} color="#D4AF37" />
              </TouchableOpacity>
            </View>
          </View>

          {/* High-Tech Promo Card */}
          <View className="bg-card p-8 rounded-4xl shadow-premium mb-8 relative overflow-hidden border border-accent/20">
            <PatternOverlay color="#D4AF37" opacity={0.03} />
            <View className="relative z-10 w-2/3">
              <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-1.5">Promo</Text>
              <Text className="text-3xl font-black text-foreground mb-3 uppercase tracking-wide leading-8">{t('food.hero_heading', 'Hungry?')}</Text>
              <Text className="text-muted-foreground text-xs mb-6 leading-5 font-semibold">{t('food.hero_subtitle', 'Order from the best restaurants in town.')}</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3.5 rounded-2xl self-start border border-accent/15 shadow-premium"
                onPress={scrollToRestaurants}
              >
                <Text className="text-white font-extrabold uppercase tracking-wider text-xs">{t('food.order_now', 'Order Now')}</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute -right-10 -bottom-10 opacity-5">
              <UtensilsCrossed size={200} color="#D4AF37" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-black text-foreground uppercase tracking-widest">{t('food.featured_restaurants', 'Restaurants')}</Text>
            <TouchableOpacity onPress={scrollToRestaurants}>
              <Text className="text-accent font-extrabold text-xs uppercase tracking-wider">{t('food.see_all', 'See All')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : restaurants.length === 0 ? (
            <View className="items-center py-20 bg-card rounded-4xl border border-border border-dashed shadow-premium">
              <UtensilsCrossed size={40} color="#7C8E84" />
              <Text className="mt-4 font-black text-muted-foreground uppercase tracking-widest text-sm">{t('food.no_restaurants', 'No restaurants available')}</Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
                className="bg-card rounded-4xl overflow-hidden border border-border shadow-premium mb-6"
              >
                <View className="h-48 bg-secondary/20 items-center justify-center relative">
                  {restaurant.imageUrl ? (
                    <Image source={{ uri: restaurant.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <UtensilsCrossed size={48} color="#D4AF37" opacity={0.15} />
                  )}
                  <View className="absolute top-4 right-4 bg-card/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex-row items-center gap-1.5 shadow-premium border border-accent/20">
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    <Text className="text-xs font-black text-foreground">{restaurant.ratingAverage.toFixed(1)}</Text>
                  </View>
                </View>
                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                      <Text className="font-extrabold text-xl text-foreground uppercase tracking-wide" numberOfLines={1}>{restaurant.name}</Text>
                      <Text className="text-muted-foreground text-xs mt-1.5 font-bold">{restaurant.cuisineTypes.join(' • ')}</Text>
                    </View>
                    <View className="bg-[#040806] p-2.5 rounded-xl border border-border shadow-premium">
                       <ChevronRight size={18} color="#D4AF37" />
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3 mt-4">
                    <View className="flex-row items-center gap-1.5 bg-secondary px-3.5 py-2 rounded-2xl border border-border">
                      <Clock size={14} color="#7C8E84" />
                      <Text className="text-xs font-bold text-muted-foreground">{restaurant.avgPrepMinutes ?? 25} min</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-primary/10 px-3.5 py-2 rounded-2xl border border-accent/10">
                      <Text className="text-xs font-black text-accent uppercase tracking-wider">{t('food.free_delivery', 'Free Delivery')}</Text>
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
