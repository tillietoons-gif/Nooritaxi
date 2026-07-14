import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Share } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Globe, Gift, Store, ReceiptText, MapPin, Trophy, Banknote } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AuthUser, clearSession, getNotifications, getStoredUser, isDriverUser, isMerchantUser } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
        const stored = await getStoredUser();
        if (!stored) {
          router.replace('/(auth)/login');
          return;
        }
        setUser(stored);
        const notifications = await getNotifications(stored.id).catch(() => []);
        setNotificationCount(notifications.length);
      }
      load();
    }, []),
  );

  const isDriver = isDriverUser(user);
  const isMerchant = isMerchantUser(user);

  const menuItems = [
    { id: 'safety', icon: <Shield size={22} color="#D4AF37" />, title: isDriver ? t('profile.safety_center') : t('profile.safety_center'), subtitle: isDriver ? t('profile.safety_subtitle_driver') : t('profile.safety_subtitle_rider') },
    { id: 'notifications', icon: <Bell size={22} color="#D4AF37" />, title: t('profile.notifications', 'Notifications'), subtitle: t('profile.notifications_subtitle', '{{count}} new updates', { count: notificationCount }) },
    { id: 'language', icon: <Globe size={22} color="#D4AF37" />, title: t('profile.language', 'Language'), subtitle: t('profile.language_subtitle', 'English, Dari, Pashto') },
    ...(isMerchant
      ? [
          { id: 'merchant', icon: <Store size={22} color="#D4AF37" />, title: t('profile.restaurant'), subtitle: t('profile.restaurant_subtitle') },
          { id: 'orders', icon: <ReceiptText size={22} color="#D4AF37" />, title: t('profile.orders'), subtitle: t('profile.orders_subtitle') },
        ]
      : []),
    ...(!isDriver && !isMerchant
      ? [
          { id: 'loyalty', icon: <Trophy size={22} color="#D4AF37" />, title: t('profile.loyalty', 'Noori Rewards'), subtitle: t('profile.loyalty_subtitle', 'Points, tier, and redemptions') },
          { id: 'promotions', icon: <Gift size={22} color="#D4AF37" />, title: t('profile.promotions', 'Promotions'), subtitle: t('profile.promotions_subtitle', 'Active offers and promo codes') },
          { id: 'saved_places', icon: <MapPin size={22} color="#D4AF37" />, title: t('profile.saved_places', 'Saved Places'), subtitle: t('profile.saved_places_subtitle', 'Home, work, and favorites') },
          { id: 'referral', icon: <Gift size={22} color="#D4AF37" />, title: t('profile.referral', 'Refer & Earn'), subtitle: t('profile.referral_subtitle') },
        ]
      : []),
    ...(isDriver || isMerchant
      ? [{ id: 'cash_ledger', icon: <Banknote size={22} color="#D4AF37" />, title: t('profile.cash_ledger'), subtitle: t('profile.cash_ledger_subtitle') }]
      : []),
    { id: 'help', icon: <HelpCircle size={22} color="#D4AF37" />, title: t('profile.help'), subtitle: t('profile.premium_help_subtitle') },
    ...(isDriver ? [{ id: 'kyc', icon: <User size={22} color="#D4AF37" />, title: t('profile.verification'), subtitle: t('profile.verification_subtitle') }] : []),
  ];

  async function handleMenuPress(id: string) {
    switch (id) {
      case 'kyc':
        router.push('/driver-kyc');
        break;
      case 'safety':
        router.push('/trusted-contacts');
        break;
      case 'notifications':
        router.push('/notifications');
        break;
      case 'merchant':
        router.push('/(tabs)/merchant');
        break;
      case 'orders':
        router.push('/(tabs)/orders');
        break;
      case 'loyalty':
        router.push('/loyalty');
        break;
      case 'promotions':
        router.push('/promotions');
        break;
      case 'saved_places':
        router.push('/saved-places');
        break;
      case 'cash_ledger':
        router.push('/cash-ledger');
        break;
      case 'referral': {
        const code = `REF-${user?.phone?.slice(-4) ?? '1234'}`;
        try {
          await Share.share({
            message: t('profile.referral_share_message', { code }),
          });
        } catch (error) {
          Alert.alert(t('profile.referral'), t('profile.referral_alert_message', { code }));
        }
        break;
      }
      case 'language':
        router.push('/language-selection');
        break;
      case 'help':
        router.push('/help-support');
        break;
      default:
        break;
    }
  }

  async function logout() {
    await clearSession();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-foreground uppercase tracking-wider mb-8">{t('profile.title', 'Profile')}</Text>

          {/* Premium Profile Card */}
          <View className="bg-card p-8 rounded-4xl shadow-premium mb-10 overflow-hidden relative border border-accent/30">
            <PatternOverlay color="#D4AF37" opacity={0.04} />
            <View className="relative z-10 flex-row items-center gap-6">
              <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center border border-accent/20 shadow-premium">
                <User size={40} color="#D4AF37" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-2xl font-black uppercase tracking-wide">{user?.name ?? (isDriver ? t('profile.noori_driver') : t('profile.noori_user'))}</Text>
                <Text className="text-muted-foreground text-sm font-bold mt-1 tracking-wide">{user?.phone ?? t('profile.not_signed_in')}</Text>
                <View className="bg-primary/20 self-start px-3 py-1 rounded-xl mt-3 border border-accent/20">
                   <Text className="text-accent text-[10px] font-black uppercase tracking-widest">{user?.role ?? 'RIDER'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="space-y-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.id)}
                className="flex-row items-center justify-between p-5 bg-card rounded-3xl border border-border shadow-premium mb-4"
              >
                <View className="flex-row items-center gap-5">
                  <View className="p-3 bg-primary/10 border border-primary/20 rounded-2xl">
                    {item.icon}
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="font-extrabold text-sm text-foreground uppercase tracking-wide leading-5">{item.title}</Text>
                    <Text className="text-muted-foreground text-xs font-semibold mt-1 leading-4">{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#D4AF37" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={logout}
            className="flex-row items-center justify-center gap-3 p-5 mt-6 bg-destructive/10 rounded-3xl border border-destructive/20 border-dashed shadow-premium"
          >
            <LogOut size={20} color="#ba1a1a" />
            <Text className="text-destructive font-black uppercase text-xs tracking-widest">{t('profile.logout', 'Log Out')}</Text>
          </TouchableOpacity>

          <View className="mt-12 items-center mb-8">
            <View className="bg-[#040806] border border-border px-4 py-2.5 rounded-full shadow-premium">
              <Text className="text-muted-foreground text-[9px] font-black tracking-widest uppercase italic text-center">
                Noori Mobility System v1.2.0 - Complete (offline, real-time, notifications, cart, earnings, background tracking, FlashList, women-only rides)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
