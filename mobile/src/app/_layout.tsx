import React, { useEffect } from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initI18n } from '../lib/i18n';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

// Initialize i18n before rendering anything
initI18n().catch(console.error);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
    },
  },
});

export default function RootLayout() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language || 'en';
      document.documentElement.dir = i18n.dir(i18n.language);
    }
  }, [i18n, i18n.language]);

  useEffect(() => {
    // Register for push notifications (once on app start)
    registerForPushNotificationsAsync().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book-ride" options={{ headerShown: true, title: t('book_ride.title'), presentation: 'modal' }} />
        <Stack.Screen name="active-trip" options={{ headerShown: true, title: t('trips.track_active') }} />
        <Stack.Screen name="driver-kyc" options={{ headerShown: true, title: t('profile.driver_verification') }} />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, title: t('restaurant.menu'), presentation: 'card' }} />
        <Stack.Screen name="food-orders" options={{ headerShown: true, title: t('profile.orders') }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: t('checkout.title', 'Checkout'), presentation: 'modal' }} />
        <Stack.Screen name="delivery" options={{ headerShown: true, title: t('delivery.title'), presentation: 'modal' }} />
        <Stack.Screen name="loyalty" options={{ headerShown: true, title: t('profile.loyalty') }} />
        <Stack.Screen name="promotions" options={{ headerShown: true, title: t('profile.promotions') }} />
        <Stack.Screen name="saved-places" options={{ headerShown: true, title: t('profile.saved_places') }} />
        <Stack.Screen name="review" options={{ headerShown: true, title: t('review.title', 'Review') }} />
        <Stack.Screen name="cash-ledger" options={{ headerShown: true, title: t('profile.cash_ledger') }} />
        <Stack.Screen name="trusted-contacts" options={{ headerShown: true, title: t('profile.safety_center') }} />
        <Stack.Screen name="language-selection" options={{ headerShown: true, title: t('profile.language') }} />
        <Stack.Screen name="help-support" options={{ headerShown: true, title: t('support.title') }} />
        <Stack.Screen name="cart" options={{ headerShown: true, title: t('cart.title', 'Your Cart'), presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
