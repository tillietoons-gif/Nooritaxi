import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Globe } from 'lucide-react-native';
import { AuthUser, clearSession, getNotifications, getStoredUser } from '../../lib/api';

export default function ProfileScreen() {
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

  const menuItems = [
    { id: 'safety', icon: <Shield size={22} color="#006947" />, title: 'Safety Center', subtitle: 'Manage emergency contacts and trip codes' },
    { id: 'notifications', icon: <Bell size={22} color="#006947" />, title: 'Notifications', subtitle: `${notificationCount} recent alerts` },
    { id: 'language', icon: <Globe size={22} color="#006947" />, title: 'Language', subtitle: 'English, Dari, Pashto' },
    { id: 'referral', icon: <User size={22} color="#006947" />, title: 'Refer a Friend', subtitle: 'Share code and earn rewards' },
    { id: 'help', icon: <HelpCircle size={22} color="#006947" />, title: 'Help & Support', subtitle: '24/7 Assistance' },
    ...(user?.role === 'DRIVER' ? [{ id: 'kyc', icon: <User size={22} color="#006947" />, title: 'Driver Verification', subtitle: 'Upload required documents' }] : []),
  ];

  function handleMenuPress(id: string) {
    switch (id) {
      case 'kyc':
        router.push('/driver-kyc');
        break;
      case 'safety':
        Alert.alert('Safety Center', 'Safety Center will be available soon.');
        break;
      case 'notifications':
        router.push('/notifications');
        break;
      case 'referral':
        Alert.alert('Refer a Friend', `Your Referral Code: REF-${user?.phone?.slice(-4) ?? '1234'}\n\nShare this code with friends to earn AFN 50 when they complete their first ride!`);
        break;
      case 'language':
        Alert.alert('Coming Soon', 'Language selection will be available soon.');
        break;
      case 'help':
        Alert.alert('Coming Soon', 'Help & Support will be available soon.');
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
      <View className="px-4 py-8">
        <View className="flex-row items-center gap-4 mb-10">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center border-4 border-white shadow-sm">
            <User size={40} color="#006947" />
          </View>
          <View>
            <Text className="text-2xl font-bold">{user?.name ?? 'Noori user'}</Text>
            <Text className="text-muted-foreground">{user?.phone ?? 'Not signed in'}</Text>
            <Text className="text-xs text-primary font-bold mt-1">{user?.role ?? 'RIDER'}</Text>
          </View>
        </View>

        <View className="space-y-3">
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => handleMenuPress(item.id)} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-muted/10">
              <View className="flex-row items-center gap-4">
                <View className="p-2 bg-primary/5 rounded-lg">
                  {item.icon}
                </View>
                <View>
                  <Text className="font-bold text-sm">{item.title}</Text>
                  <Text className="text-muted-foreground text-xs">{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#bccac0" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={logout} className="flex-row items-center gap-3 p-5 mt-10 bg-destructive/5 rounded-2xl border border-destructive/10">
          <LogOut size={20} color="#ba1a1a" />
          <Text className="text-destructive font-bold">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-muted-foreground text-xs mt-10 italic">
          Noori Mobility System v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
