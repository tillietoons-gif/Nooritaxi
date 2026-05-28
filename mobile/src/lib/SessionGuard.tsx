import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getStoredUser } from './api';
import { View, ActivityIndicator } from 'react-native';

/**
 * Wrap children in this component to require authentication.
 * Redirects to /auth/login if not authenticated.
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getStoredUser();
      if (!user && mounted) {
        router.replace('/(auth)/login');
      } else if (mounted) {
        setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#006947" />
      </View>
    );
  }
  return <>{children}</>;
}
