import { useTier } from "@/lib/tier";
import { Lock, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  inline?: boolean; // If true, shows lock icon inline instead of overlay
  className?: string;
}

/** Wraps content that requires Pro. Shows locked overlay or inline badge for free users. */
export function ProGate({ feature, children, inline, className }: ProGateProps) {
  const { isPro, promptUpgrade } = useTier();

  if (isPro) return <>{children}</>;

  if (inline) {
    return (
      <button
        onClick={() => promptUpgrade(feature)}
        className={`flex items-center gap-1.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer ${className || ""}`}
        data-testid={`pro-gate-${feature.toLowerCase().replace(/\s/g, "-")}`}
      >
        <Lock className="w-3 h-3" />
        <span className="text-xs">Pro</span>
      </button>
    );
  }

  return (
    <div
      className={`relative ${className || ""}`}
      onClick={() => promptUpgrade(feature)}
      role="button"
      tabIndex={0}
      data-testid={`pro-gate-${feature.toLowerCase().replace(/\s/g, "-")}`}
    >
      {/* Blurred content */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer rounded-lg">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 border border-border backdrop-blur-sm">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-foreground">Pro</span>
        </div>
      </div>
    </div>
  );
}

/** Small Pro badge shown next to feature labels */
export function ProBadge({ onClick }: { onClick?: () => void }) {
  const { isPro, promptUpgrade } = useTier();
  if (isPro) return null;
  return (
    <Badge
      variant="outline"
      className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onClick ? onClick() : promptUpgrade("Pro features");
      }}
    >
      <Crown className="w-2.5 h-2.5 mr-0.5" />
      PRO
    </Badge>
  );
}
