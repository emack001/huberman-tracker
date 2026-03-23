import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Tier = "free" | "pro";

export interface TierFeatures {
  rpeTracking: boolean;
  scheduleBAccess: boolean;
  sessionNotes: boolean;
  fullHistory: boolean; // false = last 2 weeks only
  progressInsights: boolean;
  exportData: boolean;
  allStats: boolean; // false = only streak + this week
}

const FREE_FEATURES: TierFeatures = {
  rpeTracking: false,
  scheduleBAccess: false,
  sessionNotes: false,
  fullHistory: false,
  progressInsights: false,
  exportData: false,
  allStats: false,
};

const PRO_FEATURES: TierFeatures = {
  rpeTracking: true,
  scheduleBAccess: true,
  sessionNotes: true,
  fullHistory: true,
  progressInsights: true,
  exportData: true,
  allStats: true,
};

interface TierContextValue {
  tier: Tier;
  features: TierFeatures;
  isPro: boolean;
  showUpgrade: boolean;
  setShowUpgrade: (show: boolean) => void;
  promptUpgrade: (feature: string) => void;
  upgradeFeature: string;
  upgradeToPro: () => void;
}

const TierContext = createContext<TierContextValue | null>(null);

export function TierProvider({ children }: { children: ReactNode }) {
  // Tier state — in production this would be backed by auth + payment
  // For now, stored in React state (resets on refresh = always free for demo)
  const [tier, setTier] = useState<Tier>("free");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  const features = tier === "pro" ? PRO_FEATURES : FREE_FEATURES;
  const isPro = tier === "pro";

  const promptUpgrade = useCallback((feature: string) => {
    setUpgradeFeature(feature);
    setShowUpgrade(true);
  }, []);

  const upgradeToPro = useCallback(() => {
    setTier("pro");
    setShowUpgrade(false);
  }, []);

  return (
    <TierContext.Provider
      value={{
        tier,
        features,
        isPro,
        showUpgrade,
        setShowUpgrade,
        promptUpgrade,
        upgradeFeature,
        upgradeToPro,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be used within TierProvider");
  return ctx;
}

// Feature descriptions for the upgrade modal
export const PRO_FEATURE_LIST = [
  {
    key: "rpeTracking",
    label: "RPE Tracking",
    description: "Log Rate of Perceived Exertion (1-10) for every set to autoregulate your training intensity.",
    icon: "gauge",
  },
  {
    key: "scheduleBAccess",
    label: "Schedule B (Hypertrophy)",
    description: "Unlock Schedule B with 8-15 rep ranges and monthly A/B periodization switching.",
    icon: "arrow-left-right",
  },
  {
    key: "sessionNotes",
    label: "Session Notes",
    description: "Add notes to each workout to track how sessions feel over time.",
    icon: "notebook-pen",
  },
  {
    key: "fullHistory",
    label: "Full Workout History",
    description: "Access your complete workout history. Free tier shows last 2 weeks only.",
    icon: "history",
  },
  {
    key: "progressInsights",
    label: "Progress Insights",
    description: "See weight trends and progressive overload tracking per exercise.",
    icon: "trending-up",
  },
  {
    key: "exportData",
    label: "Export Data",
    description: "Export your workout data as CSV for analysis in spreadsheets.",
    icon: "download",
  },
  {
    key: "allStats",
    label: "Advanced Stats",
    description: "Unlock total sessions, cumulative training time, and more dashboard metrics.",
    icon: "bar-chart-3",
  },
];
