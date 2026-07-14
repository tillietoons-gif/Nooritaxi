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
import { PatternOverlay } from './PatternOverlay';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const drawingProgress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.75);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Fade in background
    bgOpacity.value = withTiming(1, { duration: 1000 });

    // 2. Start drawing logo (gold line)
    drawingProgress.value = withDelay(
      400,
      withTiming(1, {
        duration: 2200,
        easing: Easing.bezier(0.16, 1, 0.3, 1)
      })
    );

    // 3. Scale up logo with custom spring feel and fade in luxury titles
    logoScale.value = withDelay(
      2000,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.6)) })
    );

    textOpacity.value = withDelay(
      2300,
      withTiming(1, { duration: 1000 }, () => {
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
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, bgStyle]}>
        <PatternOverlay color="#D4AF37" opacity={0.03} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={[logoStyle, styles.logoShadow]}>
          <NooriLogo size={width * 0.42} progress={drawingProgress} color="#D4AF37" />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.title}>NOORI</Animated.Text>
          <Animated.Text style={styles.subtitle}>ELEVATED MOBILITY</Animated.Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, textStyle]}>
        <Animated.Text style={styles.footerText}>SECURE • RELIABLE • AFFORDABLE</Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040806', // Premium velvet dark base
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#040806',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShadow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
  },
  textContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#D4AF37', // Luxurious golden text
    letterSpacing: 8,
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 12,
    color: '#7C8E84', // Emerald sage neutral text
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '700',
    opacity: 0.85,
    letterSpacing: 3,
  },
});
