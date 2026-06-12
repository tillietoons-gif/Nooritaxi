import React, { useEffect } from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initI18n } from '../lib/i18n';
import { registerForPushNotificationsAsync } from '../lib/notifications';

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
        <Stack.Screen name="book-ride" options={{ headerShown: true, title: 'Book a Ride', presentation: 'modal' }} />
        <Stack.Screen name="active-trip" options={{ headerShown: true, title: 'Active Trip' }} />
        <Stack.Screen name="driver-kyc" options={{ headerShown: true, title: 'Driver Verification' }} />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, title: 'Menu', presentation: 'card' }} />
        <Stack.Screen name="food-orders" options={{ headerShown: true, title: 'Food Orders' }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout', presentation: 'modal' }} />
        <Stack.Screen name="delivery" options={{ headerShown: true, title: 'Delivery', presentation: 'modal' }} />
        <Stack.Screen name="loyalty" options={{ headerShown: true, title: 'Noori Rewards' }} />
        <Stack.Screen name="promotions" options={{ headerShown: true, title: 'Promotions' }} />
        <Stack.Screen name="saved-places" options={{ headerShown: true, title: 'Saved Places' }} />
        <Stack.Screen name="review" options={{ headerShown: true, title: 'Review' }} />
        <Stack.Screen name="cash-ledger" options={{ headerShown: true, title: 'Cash Ledger' }} />
        <Stack.Screen name="trusted-contacts" options={{ headerShown: true, title: 'Safety Center' }} />
        <Stack.Screen name="language-selection" options={{ headerShown: true, title: 'Language' }} />
        <Stack.Screen name="help-support" options={{ headerShown: true, title: 'Help & Support' }} />
        <Stack.Screen name="cart" options={{ headerShown: true, title: 'Your Cart', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}