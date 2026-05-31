import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Car, Utensils, Package, Wallet, Bell, ChevronRight, User, Plus, Search } from 'lucide-react-native';
import { getStoredUser, getWalletBalance, WalletBalance, AuthUser } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        const balance = await getWalletBalance(storedUser.id);
        setWallet(balance);
      }
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const greeting = new Date().getHours() < 12 ? t('home.greeting_morning') : t('home.greeting_evening');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        {/* Header Section */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-muted-foreground text-sm font-medium">
              {greeting},
            </Text>
            <Text className="text-2xl font-bold text-foreground">
              {user?.name || 'Friend'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            className="bg-card p-3 rounded-full shadow-sm border border-muted/20"
          >
            <Bell size={24} color="#006947" />
            <View className="absolute top-3 right-3 w-3 h-3 bg-destructive rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* High-Tech Wallet Card */}
        <View className="px-6 py-4">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/wallet')}
            className="bg-primary rounded-3xl p-6 shadow-high-tech overflow-hidden relative"
            style={{ shadowColor: '#006947', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
          >
            {/* Cultural Pattern Overlay */}
            <PatternOverlay color="#ffffff" opacity={0.08} />

            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{t('home.wallet_label')}</Text>
                <Text className="text-white text-3xl font-bold">
                  AFN {Number(wallet?.balance || 0).toLocaleString()}
                </Text>
              </View>
              <View className="bg-white/20 p-2 rounded-xl">
                <Wallet size={24} color="white" />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-white/10 py-3 rounded-2xl flex-row items-center justify-center gap-2 border border-white/10">
                <Plus size={16} color="white" />
                <Text className="text-white font-bold">{t('home.add_money')}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/5 py-3 px-4 rounded-2xl flex-row items-center justify-center border border-white/10">
                <Text className="text-white font-bold">{t('home.details')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar / Quick Action */}
        <View className="px-6 py-2">
          <TouchableOpacity
            onPress={() => router.push('/book-ride')}
            className="bg-card flex-row items-center px-4 py-4 rounded-2xl border border-muted/30 shadow-sm"
          >
            <Search size={20} color="#6D7A71" />
            <Text className="ml-3 text-muted-foreground font-medium">{t('home.search_placeholder')}</Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <View className="px-6 py-6">
          <Text className="text-lg font-bold text-foreground mb-4">{t('home.services_title')}</Text>
          <View className="flex-row flex-wrap justify-between">

            {/* Taxi Service */}
            <TouchableOpacity
              onPress={() => router.push('/book-ride')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-primary/10 p-4 rounded-2xl mb-3">
                <Car size={32} color="#006947" />
              </View>
              <Text className="font-bold text-foreground">{t('home.taxi_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.taxi_sub')}</Text>
            </TouchableOpacity>

            {/* Food Service */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/food')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-orange-500/10 p-4 rounded-2xl mb-3">
                <Utensils size={32} color="#f97316" />
              </View>
              <Text className="font-bold text-foreground">{t('home.food_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.food_sub')}</Text>
            </TouchableOpacity>

            {/* Parcel Service */}
            <TouchableOpacity
              onPress={() => router.push('/delivery')}
              className="w-[48%] bg-card p-5 rounded-3xl border border-muted/20 shadow-sm items-center mb-4"
            >
              <View className="bg-blue-500/10 p-4 rounded-2xl mb-3">
                <Package size={32} color="#3b82f6" />
              </View>
              <Text className="font-bold text-foreground">{t('home.parcel_label')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">{t('home.parcel_sub')}</Text>
            </TouchableOpacity>

            {/* More / Cultural Info */}
            <TouchableOpacity
              className="w-[48%] bg-accent/5 p-5 rounded-3xl border border-accent/20 shadow-sm items-center border-dashed mb-4"
            >
              <View className="bg-accent/10 p-4 rounded-2xl mb-3">
                <ChevronRight size={32} color="#D4AF37" />
              </View>
              <Text className="font-bold text-accent">{t('home.more_label')}</Text>
              <Text className="text-xs text-accent/70 text-center mt-1">{t('home.more_sub')}</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Promo / Cultural Banner */}
        <View className="px-6 pb-10">
          <View className="bg-secondary/30 rounded-3xl p-6 relative overflow-hidden border border-accent/10">
             {/* Cultural pattern background */}
             <PatternOverlay color="#D4AF37" opacity={0.04} />

             <View className="flex-row justify-between items-center">
               <View className="flex-1 pr-4">
                 <Text className="text-accent font-bold text-[10px] uppercase tracking-widest mb-1">CULTURAL TIP</Text>
                 <Text className="text-foreground font-bold text-lg mb-2">{t('home.cultural_tip_title')}</Text>
                 <Text className="text-muted-foreground text-xs leading-5">
                   {t('home.cultural_tip_body')}
                 </Text>
               </View>
               <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-sm">
                  <User size={30} color="#D4AF37" />
               </View>
             </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
