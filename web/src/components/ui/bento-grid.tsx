"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
  background,
  size = "medium",
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  background?: React.ReactNode;
  size?: "small" | "medium" | "large";
}) => {
  const sizeClasses = {
    small: "md:col-span-1 md:row-span-1",
    medium: "md:col-span-1 md:row-span-2",
    large: "md:col-span-2 md:row-span-2",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl glass-premium p-6 bento-shadow",
        sizeClasses[size],
        className
      )}
    >
      {background && (
        <div className="absolute inset-0 z-0">
          {background}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        {header && <div className="mb-4">{header}</div>}
        <div className="mt-auto group-hover:translate-x-1 transition-transform duration-300">
          {icon && <div className="mb-2 text-primary">{icon}</div>}
          <div className={cn(
            "font-heading font-bold text-xl mb-1",
            background ? "text-white" : "text-foreground"
          )}>
            {title}
          </div>
          <div className={cn(
            "font-sans font-normal text-sm leading-relaxed",
            background ? "text-white/80" : "text-muted-foreground"
          )}>
            {description}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
