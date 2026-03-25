import { useState } from "react";
import { useTier, PRO_FEATURE_LIST } from "@/lib/tier";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gauge,
  ArrowLeftRight,
  NotebookPen,
  History,
  TrendingUp,
  Download,
  BarChart3,
  Crown,
  Sparkles,
  Loader2,
} from "lucide-react";

const iconMap: Record<string, any> = {
  gauge: Gauge,
  "arrow-left-right": ArrowLeftRight,
  "notebook-pen": NotebookPen,
  history: History,
  "trending-up": TrendingUp,
  download: Download,
  "bar-chart-3": BarChart3,
};

export function UpgradeModal() {
  const { showUpgrade, setShowUpgrade, upgradeFeature, startCheckout } = useTier();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    await startCheckout(selectedPlan);
    // If redirect fails for some reason, reset
    setIsRedirecting(false);
  };

  return (
    <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold">
            Upgrade to JMR Wellness Pro
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {upgradeFeature
              ? `Unlock ${upgradeFeature} and all Pro features.`
              : "Unlock the full Huberman Protocol experience."}
          </DialogDescription>
        </DialogHeader>

        {/* Feature list */}
        <div className="space-y-3 my-2">
          {PRO_FEATURE_LIST.map((feature) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            const isHighlighted =
              upgradeFeature &&
              feature.label.toLowerCase().includes(upgradeFeature.toLowerCase());
            return (
              <div
                key={feature.key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isHighlighted
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-card-border bg-card"
                }`}
                data-testid={`feature-${feature.key}`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{feature.label}</p>
                    {isHighlighted && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        REQUESTED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan selector */}
        <div className="border-t border-border pt-4 mt-2">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selectedPlan === "monthly"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <p className="text-sm font-semibold">Monthly</p>
              <p className="text-xl font-bold mt-1">$4.99</p>
              <p className="text-[10px] text-muted-foreground">per month</p>
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`rounded-xl border p-3 text-left transition-colors relative ${
                selectedPlan === "yearly"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <span className="absolute -top-2 right-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                SAVE 33%
              </span>
              <p className="text-sm font-semibold">Yearly</p>
              <p className="text-xl font-bold mt-1">$39.99</p>
              <p className="text-[10px] text-muted-foreground">per year</p>
            </button>
          </div>

          <Button
            className="w-full h-11 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            onClick={handleUpgrade}
            disabled={isRedirecting}
            data-testid="button-upgrade-pro"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start 7-Day Free Trial
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground mt-1"
            onClick={() => setShowUpgrade(false)}
            data-testid="button-maybe-later"
          >
            Maybe later
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          7-day free trial. Cancel anytime. Billed via Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
