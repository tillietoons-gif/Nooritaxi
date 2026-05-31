import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface NooriLogoProps {
  size?: number;
  color?: string;
  progress?: Animated.SharedValue<number>;
}

export const NooriLogo: React.FC<NooriLogoProps> = ({
  size = 100,
  color = "#006947",
  progress
}) => {
  // Shield path
  const shieldPath = "M 50 10 L 15 25 V 55 C 15 75, 50 90, 50 90 C 50 90, 85 75, 85 55 V 25 L 50 10 Z";

  // Stylized N path
  const nPath = "M 35 65 V 35 L 65 65 V 35";

  // Approximate lengths for strokeDasharray
  const shieldLength = 260;
  const nLength = 100;

  const shieldProps = useAnimatedProps(() => ({
    strokeDashoffset: shieldLength * (1 - (progress?.value ?? 1)),
  }));

  const nProps = useAnimatedProps(() => ({
    strokeDashoffset: nLength * (1 - (progress?.value ?? 1)),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <AnimatedPath
          d={shieldPath}
          strokeDasharray={shieldLength}
          animatedProps={shieldProps}
        />
        <AnimatedPath
          d={nPath}
          strokeDasharray={nLength}
          animatedProps={nProps}
        />
      </G>
    </Svg>
  );
};
