"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserBehavior {
  preferredService: "ride" | "delivery" | null;
  visitCount: number;
  lastVisit: string;
  isTrackingActive: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  featureUsage: Record<string, number>;
}

const UserBehaviorContext = createContext<{
  behavior: UserBehavior;
  updateBehavior: (updates: Partial<UserBehavior>) => void;
  trackFeatureUsage: (feature: string) => void;
} | undefined>(undefined);

export const UserBehaviorProvider = ({ children }: { children: React.ReactNode }) => {
  const [behavior, setBehavior] = useState<UserBehavior>({
    preferredService: null,
    visitCount: 0,
    lastVisit: "",
    isTrackingActive: false,
    timeOfDay: "morning",
    featureUsage: {},
  });

  useEffect(() => {
    const hour = new Date().getHours();
    let tod: UserBehavior["timeOfDay"] = "morning";
    if (hour >= 12 && hour < 17) tod = "afternoon";
    else if (hour >= 17 && hour < 21) tod = "evening";
    else if (hour >= 21 || hour < 5) tod = "night";

    const saved = localStorage.getItem("noori_user_behavior");
    const parsed = saved ? JSON.parse(saved) : {};

    setBehavior((prev) => ({
      ...prev,
      ...parsed,
      visitCount: (parsed.visitCount || 0) + 1,
      lastVisit: new Date().toISOString(),
      timeOfDay: tod,
      featureUsage: parsed.featureUsage || {},
    }));
  }, []);

  useEffect(() => {
    if (behavior.visitCount > 0) {
      localStorage.setItem("noori_user_behavior", JSON.stringify(behavior));
    }
  }, [behavior]);

  const updateBehavior = (updates: Partial<UserBehavior>) => {
    setBehavior((prev) => ({ ...prev, ...updates }));
  };

  const trackFeatureUsage = (feature: string) => {
    setBehavior((prev) => {
      const newUsage = { ...prev.featureUsage, [feature]: (prev.featureUsage[feature] || 0) + 1 };
      return { ...prev, featureUsage: newUsage };
    });
  };

  return (
    <UserBehaviorContext.Provider value={{ behavior, updateBehavior, trackFeatureUsage }}>
      {children}
    </UserBehaviorContext.Provider>
  );
};

export const useUserBehavior = () => {
  const context = useContext(UserBehaviorContext);
  if (!context) throw new Error("useUserBehavior must be used within a UserBehaviorProvider");
  return context;
};
