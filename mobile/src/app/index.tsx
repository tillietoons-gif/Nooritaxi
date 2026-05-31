import React, { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { getStoredUser } from '../lib/api';
import { SplashScreen } from '../components/SplashScreen';

export default function IndexRoute() {
  const [target, setTarget] = useState<'/(auth)/login' | '/(tabs)/trips' | null>(null);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const user = await getStoredUser();
        if (mounted) {
          setTarget(user ? '/(tabs)/trips' : '/(auth)/login');
          setDataLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        if (mounted) {
          setTarget('/(auth)/login');
          setDataLoaded(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAnimationComplete = () => {
    setAnimationFinished(true);
  };

  // Only redirect if both the data is loaded AND the animation is finished
  if (dataLoaded && animationFinished && target) {
    return <Redirect href={target} />;
  }

  return <SplashScreen onAnimationComplete={handleAnimationComplete} />;
}
