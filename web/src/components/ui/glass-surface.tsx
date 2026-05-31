"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "premium" | "thin";
  intensity?: "low" | "medium" | "high";
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, variant = "default", intensity = "medium", children, ...props }, ref) => {
    const variants = {
      default: "glass",
      premium: "glass-premium",
      thin: "bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/5",
    };

    const intensities = {
      low: "backdrop-blur-sm",
      medium: "backdrop-blur-md",
      high: "backdrop-blur-2xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          intensities[intensity],
          "rounded-3xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassSurface.displayName = "GlassSurface";
