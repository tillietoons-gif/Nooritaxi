"use client"

import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface NooriLogoProps {
  size?: number;
  color?: string;
  className?: string;
  animate?: boolean;
}

export const NooriLogo: React.FC<NooriLogoProps> = ({
  size = 40,
  color = "currentColor",
  className,
  animate = true
}) => {
  // Shield path
  const shieldPath = "M 50 10 L 15 25 V 55 C 15 75, 50 90, 50 90 C 50 90, 85 75, 85 55 V 25 L 50 10 Z";

  // Stylized N path
  const nPath = "M 35 65 V 35 L 65 65 V 35";

  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
    >
      <motion.g
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? "hidden" : "visible"}
        animate="visible"
      >
        <motion.path
          d={shieldPath}
          variants={pathVariants}
        />
        <motion.path
          d={nPath}
          variants={pathVariants}
        />
      </motion.g>
    </svg>
  );
};
