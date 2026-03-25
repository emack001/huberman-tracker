import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getOrCreateUserId } from "@/lib/userId";

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
  isLoadingTier: boolean;
  showUpgrade: boolean;
  setShowUpgrade: (show: boolean) => void;
  promptUpgrade: (feature: string) => void;
  upgradeFeature: string;
  startCheckout: (plan: "monthly" | "yearly") => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

const TierContext = createContext<TierContextValue | null>(null);

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>("free");
  const [isLoadingTier, setIsLoadingTier] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  // ── On mount: fetch real tier status from the server ──────────────────────
  useEffect(() => {
    const userId = getOrCreateUserId();

    // Check for a successful Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Clear the query string without a page reload
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }

    fetch("/api/me/tier", {
      headers: { "x-user-id": userId },
    })
      .then((r) => r.json())
      .then((data: { isPro: boolean }) => {
        setTier(data.isPro ? "pro" : "free");
      })
      .catch(() => {
        // Fall back to free on network error
        setTier("free");
      })
      .finally(() => {
        setIsLoadingTier(false);
      });
  }, []);

  const features = tier === "pro" ? PRO_FEATURES : FREE_FEATURES;
  const isPro = tier === "pro";

  const promptUpgrade = useCallback((feature: string) => {
    setUpgradeFeature(feature);
    setShowUpgrade(true);
  }, []);

  // ── Redirect to Stripe Checkout ───────────────────────────────────────────
  const startCheckout = useCallback(async (plan: "monthly" | "yearly") => {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ userId, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  }, []);

  // ── Open Stripe Customer Portal (manage / cancel) ─────────────────────────
  const openBillingPortal = useCallback(async () => {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch("/api/checkout/portal", {
        method: "POST",
        headers: { "x-user-id": userId },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
  }, []);

  return (
    <TierContext.Provider
      value={{
        tier,
        features,
        isPro,
        isLoadingTier,
        showUpgrade,
        setShowUpgrade,
        promptUpgrade,
        upgradeFeature,
        startCheckout,
        openBillingPortal,
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
    description:
      "Log Rate of Perceived Exertion (1-10) for every set to autoregulate your training intensity.",
    icon: "gauge",
  },
  {
    key: "scheduleBAccess",
    label: "Schedule B (Hypertrophy)",
    description:
      "Unlock Schedule B with 8-15 rep ranges and monthly A/B periodization switching.",
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
