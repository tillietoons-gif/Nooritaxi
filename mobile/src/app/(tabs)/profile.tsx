import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Share } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Globe, Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AuthUser, clearSession, getNotifications, getStoredUser, isDriverUser } from '../../lib/api';
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

  const menuItems = [
    { id: 'safety', icon: <Shield size={22} color="#006947" />, title: isDriver ? 'Safety & support' : 'Safety Center', subtitle: isDriver ? 'Emergency contacts and trip safety' : 'Emergency contacts & safety codes' },
    { id: 'notifications', icon: <Bell size={22} color="#006947" />, title: 'Notifications', subtitle: `${notificationCount} new updates` },
    { id: 'language', icon: <Globe size={22} color="#006947" />, title: 'Language', subtitle: 'English, Dari, Pashto' },
    ...(!isDriver ? [{ id: 'referral', icon: <Gift size={22} color="#D4AF37" />, title: 'Refer & Earn', subtitle: 'Invite friends, earn AFN 50' }] : []),
    { id: 'help', icon: <HelpCircle size={22} color="#006947" />, title: 'Help & Support', subtitle: '24/7 Premium support' },
    ...(isDriver ? [{ id: 'kyc', icon: <User size={22} color="#006947" />, title: 'Verification', subtitle: 'Update your driver documents' }] : []),
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
      case 'referral': {
        const code = `REF-${user?.phone?.slice(-4) ?? '1234'}`;
        try {
          await Share.share({
            message: `Join Noori Mobility and get AFN 50 off your first ride! Use my code: ${code}`,
          });
        } catch (error) {
          Alert.alert('Refer a Friend', `Your Referral Code: ${code}\n\nShare this code with friends to earn AFN 50 when they complete their first ride!`);
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
          <Text className="text-2xl font-bold text-foreground mb-8">{t('profile.title', 'Profile')}</Text>

          {/* Premium Profile Card */}
          <View className="bg-primary p-8 rounded-4xl shadow-high-tech mb-10 overflow-hidden relative">
            <PatternOverlay color="#ffffff" opacity={0.1} />
            <View className="relative z-10 flex-row items-center gap-6">
              <View className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl items-center justify-center border border-white/30 shadow-sm">
                <User size={40} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-2xl font-black">{user?.name ?? (isDriver ? 'Noori driver' : 'Noori user')}</Text>
                <Text className="text-white/70 text-sm font-bold mt-1">{user?.phone ?? 'Not signed in'}</Text>
                <View className="bg-accent/20 self-start px-2 py-0.5 rounded-lg mt-2 border border-accent/20">
                   <Text className="text-accent text-[10px] font-black uppercase">{user?.role ?? 'RIDER'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="space-y-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.id)}
                className="flex-row items-center justify-between p-5 bg-card rounded-3xl border border-muted/10 shadow-sm mb-4"
              >
                <View className="flex-row items-center gap-5">
                  <View className="p-3 bg-primary/10 rounded-2xl">
                    {item.icon}
                  </View>
                  <View>
                    <Text className="font-bold text-sm text-foreground">{item.title}</Text>
                    <Text className="text-muted-foreground text-xs font-medium mt-0.5">{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#bccac0" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={logout}
            className="flex-row items-center justify-center gap-3 p-5 mt-6 bg-destructive/5 rounded-3xl border border-destructive/10 border-dashed"
          >
            <LogOut size={20} color="#ba1a1a" />
            <Text className="text-destructive font-black uppercase text-xs tracking-widest">{t('profile.logout', 'Log Out')}</Text>
          </TouchableOpacity>

          <View className="mt-12 items-center">
            <View className="bg-muted/10 px-4 py-2 rounded-full">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase italic">
                Noori Mobility System v1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
