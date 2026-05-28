import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

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
      </Stack>
    </>
  );
}
