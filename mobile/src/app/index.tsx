import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { getStoredUser } from '../lib/api';

export default function IndexRoute() {
  const [target, setTarget] = React.useState<'/(auth)/login' | '/(tabs)/trips' | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const user = await getStoredUser();
      if (mounted) {
        setTarget(user ? '/(tabs)/trips' : '/(auth)/login');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#006947" />
      </View>
    );
  }

  return <Redirect href={target} />;
}