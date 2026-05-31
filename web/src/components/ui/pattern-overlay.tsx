import React from 'react';
import { cn } from "@/lib/utils";

interface PatternOverlayProps {
  color?: string;
  opacity?: number;
  className?: string;
}

export const PatternOverlay: React.FC<PatternOverlayProps> = ({
  color = "#D4AF37",
  opacity = 0.05,
  className
}) => {
  const patternId = `afghanPattern-${color.replace('#', '')}`;

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
            viewBox="0 0 40 40"
          >
            {/* Simple Geometric Star/Diamond inspired by Afghan embroidery */}
            <path
              d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z"
              fill={color}
              fillOpacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};
