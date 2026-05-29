import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Bell, CheckCircle2, AlertTriangle, Info, BellRing } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, apiFetch } from '../../lib/api';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
      try {
        const user = await getStoredUser();
        if (!user) return;
        const res = await apiFetch(`/users/${user.id}/notifications`);
        if (!res.ok) throw new Error('Failed to load notifications');
        const data = await res.json();
        setNotifications(data);
      } catch (e) {
        console.warn('Failed to load notifications', e);
      }
    }
    load();
    }, [])
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'PROMO': return <BellRing size={20} color="#006947" />;
      case 'TRIP_UPDATE': return <CheckCircle2 size={20} color="#006947" />;
      case 'ALERT': return <AlertTriangle size={20} color="#ba1a1a" />;
      default: return <Info size={20} color="#006947" />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-4 py-4">
        {loading ? (
          [1, 2, 3].map((i) => <View key={i} className="h-20 bg-muted/30 rounded-2xl mb-3" />)
        ) : notifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="bg-primary/5 p-6 rounded-full mb-4">
              <Bell size={48} color="#6d7a71" />
            </View>
            <Text className="text-xl font-bold mb-2">{t('notifications.no_notifications')}</Text>
            <Text className="text-muted-foreground">{t('notifications.no_notifications_subtitle')}</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity key={n.id} className={`flex-row p-4 rounded-2xl mb-3 border ${n.isRead ? 'bg-card border-muted/10' : 'bg-primary/5 border-primary/20'}`}>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4">
                {getIcon(n.type)}
              </View>
              <View className="flex-1">
                <Text className={`font-bold ${n.isRead ? 'text-foreground' : 'text-primary'}`}>{n.title}</Text>
                <Text className="text-muted-foreground text-sm mt-1">{n.body}</Text>
                <Text className="text-xs text-muted-foreground/60 mt-2">
                  {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!n.isRead && <View className="w-2 h-2 rounded-full bg-primary self-center" />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
