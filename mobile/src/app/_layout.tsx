import React from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initI18n } from '../lib/i18n';

// Initialize i18n before rendering anything
initI18n().catch(console.error);

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book-ride" options={{ headerShown: true, title: 'Book a Ride', presentation: 'modal' }} />
        <Stack.Screen name="active-trip" options={{ headerShown: true, title: 'Active Trip' }} />
        <Stack.Screen name="driver-kyc" options={{ headerShown: true, title: 'Driver Verification' }} />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, title: 'Menu', presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout', presentation: 'modal' }} />
        <Stack.Screen name="delivery" options={{ headerShown: true, title: 'Delivery', presentation: 'modal' }} />
        <Stack.Screen name="trusted-contacts" options={{ headerShown: true, title: 'Safety Center' }} />
        <Stack.Screen name="language-selection" options={{ headerShown: true, title: 'Language' }} />
        <Stack.Screen name="help-support" options={{ headerShown: true, title: 'Help & Support' }} />
      </Stack>
    </>
  );
}
