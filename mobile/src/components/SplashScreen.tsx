import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { NooriLogo } from './NooriLogo';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const drawingProgress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Fade in background
    bgOpacity.value = withTiming(1, { duration: 800 });

    // 2. Start drawing logo
    drawingProgress.value = withDelay(
      500,
      withTiming(1, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    );

    // 3. Scale up logo and fade in text
    logoScale.value = withDelay(
      2200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
    );

    textOpacity.value = withDelay(
      2500,
      withTiming(1, { duration: 800 }, () => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(textOpacity.value * 0, { duration: 0 }) }], // Just to trigger transform
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, bgStyle]} />

      <View style={styles.content}>
        <Animated.View style={logoStyle}>
          <NooriLogo size={width * 0.4} progress={drawingProgress} color="#006947" />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.title}>NOORI</Animated.Text>
          <Animated.Text style={styles.subtitle}>Moving Kabul</Animated.Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, textStyle]}>
        <Animated.Text style={styles.footerText}>Secure • Reliable • Affordable</Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8FAF9', // Slightly off-white for depth
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#006947',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6d7a71',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#006947',
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
