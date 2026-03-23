import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getScheduleLabel } from "@/lib/protocol";
import type { Settings } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Info, Crown } from "lucide-react";
import { useTier } from "@/lib/tier";
import { ProGate, ProBadge } from "@/components/pro-gate";

export default function SettingsPage() {
  const { toast } = useToast();
  const { features, isPro, promptUpgrade } = useTier();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const toggleSchedule = useMutation({
    mutationFn: async () => {
      const newSchedule = settings?.currentSchedule === "A" ? "B" : "A";
      await apiRequest("PUT", "/api/settings", {
        currentSchedule: newSchedule,
        scheduleStartDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Schedule switched",
        description: `Now on Schedule ${settings?.currentSchedule === "A" ? "B" : "A"}`,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const scheduleStart = settings?.scheduleStartDate
    ? new Date(settings.scheduleStartDate)
    : new Date();
  const daysSinceSwitch = Math.floor(
    (Date.now() - scheduleStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, 30 - daysSinceSwitch);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight" data-testid="text-title">Settings</h1>

      {/* Current Schedule */}
      <Card className="border-card-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold" data-testid="text-schedule">
                Schedule {settings?.currentSchedule}
              </p>
              <p className="text-sm text-muted-foreground">
                {getScheduleLabel(settings?.currentSchedule || "A")}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-mono bg-primary/10 text-primary border-primary/20 px-3 py-1"
            >
              {settings?.currentSchedule === "A" ? "STRENGTH" : "HYPERTROPHY"}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days on current schedule</span>
            <span className="font-mono tabular-nums">{daysSinceSwitch}</span>
          </div>

          {daysRemaining > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days until recommended switch</span>
              <span className="font-mono tabular-nums">{daysRemaining}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min(100, (daysSinceSwitch / 30) * 100)}%` }}
            />
          </div>

          {features.scheduleBAccess ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => toggleSchedule.mutate()}
              disabled={toggleSchedule.isPending}
              data-testid="button-switch-schedule"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Switch to Schedule {settings?.currentSchedule === "A" ? "B" : "A"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
              onClick={() => promptUpgrade("Schedule B (Hypertrophy)")}
              data-testid="button-switch-schedule-locked"
            >
              <Crown className="w-4 h-4 mr-2" />
              Unlock Schedule B with Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Schedule comparison */}
      <Card className="border-card-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Schedule Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${
                settings?.currentSchedule === "A"
                  ? "border-primary/30 bg-primary/5"
                  : "border-card-border"
              }`}
            >
              <p className="font-semibold text-sm mb-2">Schedule A</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>4-8 reps per exercise</li>
                <li>3-4 sets per exercise</li>
                <li>2-4 min rest between sets</li>
                <li>Heavier weights</li>
                <li>Focus: Strength</li>
              </ul>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                settings?.currentSchedule === "B"
                  ? "border-primary/30 bg-primary/5"
                  : "border-card-border"
              }`}
            >
              <p className="font-semibold text-sm mb-2">Schedule B</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>8-15 reps per exercise</li>
                <li>2-3 sets per exercise</li>
                <li>~90 sec rest between sets</li>
                <li>Moderate weights</li>
                <li>Focus: Hypertrophy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-card-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Huberman recommends alternating between Schedule A and B monthly
                to optimize both strength and hypertrophy gains.
              </p>
              <p>
                Choose two exercises per muscle group: one targeting the shortened position,
                one targeting the lengthened position. Keep workouts to 50-60 minutes
                of hard work after warm-up, 75 minutes max.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
