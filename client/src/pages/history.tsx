import { useQuery } from "@tanstack/react-query";
import type { WorkoutLog } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dumbbell,
  HeartPulse,
  Snowflake,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  Crown,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { useTier } from "@/lib/tier";

function getTypeIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("legs") || l.includes("torso") || l.includes("arms"))
    return <Dumbbell className="w-4 h-4" />;
  if (l.includes("hiit") || l.includes("cardio") || l.includes("endurance"))
    return <HeartPulse className="w-4 h-4" />;
  if (l.includes("recovery")) return <Snowflake className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}

function getTypeBg(label: string) {
  const l = label.toLowerCase();
  if (l.includes("legs") || l.includes("torso") || l.includes("arms"))
    return "bg-orange-500/10 text-orange-400";
  if (l.includes("hiit") || l.includes("cardio") || l.includes("endurance"))
    return "bg-blue-500/10 text-blue-400";
  if (l.includes("recovery")) return "bg-cyan-500/10 text-cyan-400";
  return "bg-primary/10 text-primary";
}

export default function History() {
  const { features, promptUpgrade } = useTier();
  const { data: workouts, isLoading } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workouts"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  // Filter by tier: free = last 14 days, pro = all
  const cutoffDate = features.fullHistory
    ? "1900-01-01"
    : subDays(new Date(), 14).toISOString().split("T")[0];

  const visibleWorkouts = workouts?.filter((w) => w.date >= cutoffDate) ?? [];
  const hiddenCount = (workouts?.length ?? 0) - visibleWorkouts.length;

  const grouped: Record<string, WorkoutLog[]> = {};
  visibleWorkouts.forEach((w) => {
    if (!grouped[w.date]) grouped[w.date] = [];
    grouped[w.date].push(w);
  });

  const sortedDates = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight" data-testid="text-title">History</h1>

      {sortedDates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No workouts logged yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Start a workout from the dashboard to see your history here.
          </p>
        </div>
      )}

      {sortedDates.map((date) => (
        <div key={date}>
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
            {format(parseISO(date), "EEEE, MMM d, yyyy")}
          </h2>
          <div className="space-y-2">
            {grouped[date].map((workout) => (
              <Card key={workout.id} className="border-card-border" data-testid={`card-history-${workout.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${getTypeBg(
                      workout.dayLabel
                    )}`}
                  >
                    {getTypeIcon(workout.dayLabel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{workout.dayLabel}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-primary/5 border-primary/20 text-primary"
                      >
                        {workout.schedule}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Day {workout.dayNumber}
                      </span>
                      {workout.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                  {workout.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Upgrade prompt for hidden history */}
      {hiddenCount > 0 && (
        <button
          onClick={() => promptUpgrade("Full Workout History")}
          className="w-full p-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 flex items-center justify-center gap-2 hover:bg-amber-500/10 transition-colors cursor-pointer"
          data-testid="button-unlock-history"
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-500 font-medium">
            {hiddenCount} older workout{hiddenCount > 1 ? "s" : ""} hidden
          </span>
          <span className="text-xs text-amber-500/70">Unlock with Pro</span>
        </button>
      )}
    </div>
  );
}
