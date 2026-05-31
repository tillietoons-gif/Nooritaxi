import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';

interface PatternOverlayProps {
  color?: string;
  opacity?: number;
}

export const PatternOverlay: React.FC<PatternOverlayProps> = ({
  color = "#D4AF37",
  opacity = 0.05
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={`afghanPattern-${color.replace('#', '')}`}
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
            viewBox="0 0 40 40"
          >
            {/* Simple Geometric Star/Diamond inspired by Afghan embroidery */}
            <Path
              d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z"
              fill={color}
              opacity={opacity}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#afghanPattern-${color.replace('#', '')})`} />
      </Svg>
    </View>
  );
};
