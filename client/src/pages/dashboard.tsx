import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PROTOCOL_DAYS, getScheduleLabel } from "@/lib/protocol";
import { useTier } from "@/lib/tier";
import { ProGate, ProBadge } from "@/components/pro-gate";
import type { WorkoutLog, Settings } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dumbbell,
  HeartPulse,
  Snowflake,
  Activity,
  CheckCircle2,
  ChevronRight,
  Calendar,
  TrendingUp,
  Flame,
  Timer,
  Crown,
} from "lucide-react";

function getDayIcon(type: string) {
  switch (type) {
    case "resistance":
      return <Dumbbell className="w-5 h-5" />;
    case "cardio":
      return <HeartPulse className="w-5 h-5" />;
    case "recovery":
      return <Snowflake className="w-5 h-5" />;
    default:
      return <Activity className="w-5 h-5" />;
  }
}

function getDayBgClass(type: string) {
  switch (type) {
    case "resistance":
      return "bg-orange-500/10 text-orange-400";
    case "cardio":
      return "bg-blue-500/10 text-blue-400";
    case "recovery":
      return "bg-cyan-500/10 text-cyan-400";
    default:
      return "bg-primary/10 text-primary";
  }
}

export default function Dashboard() {
  const { features, isPro, promptUpgrade } = useTier();

  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: workouts, isLoading: workoutsLoading } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workouts"],
  });

  const isLoading = settingsLoading || workoutsLoading;
  const today = new Date().toISOString().split("T")[0];

  // Calculate stats
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekStr = thisWeekStart.toISOString().split("T")[0];

  const completedThisWeek = workouts?.filter(
    (w) => w.completed && w.date >= thisWeekStr
  ).length ?? 0;

  const totalWorkouts = workouts?.filter((w) => w.completed).length ?? 0;

  const totalMinutes = workouts
    ?.filter((w) => w.completed && w.duration)
    .reduce((sum, w) => sum + (w.duration || 0), 0) ?? 0;

  // Streak calculation
  let streak = 0;
  if (workouts && workouts.length > 0) {
    const sortedDates = [...new Set(workouts.filter(w => w.completed).map((w) => w.date))].sort().reverse();
    const todayDate = new Date(today);
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkStr = checkDate.toISOString().split("T")[0];
      if (sortedDates.includes(checkStr)) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Today's workout check
  const todaysWorkouts = workouts?.filter((w) => w.date === today) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-title">
            Huberman Protocol
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule {settings?.currentSchedule} — {getScheduleLabel(settings?.currentSchedule || "A")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPro ? (
            <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2.5 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
              onClick={() => promptUpgrade("Pro features")}
              data-testid="button-upgrade-header"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          )}
          <Badge
            variant="outline"
            className="text-xs font-mono bg-primary/10 text-primary border-primary/20"
            data-testid="badge-schedule"
          >
            {settings?.currentSchedule === "A" ? "STRENGTH" : "HYPERTROPHY"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Free: Streak */}
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium">Streak</span>
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums" data-testid="text-streak">
              {streak}
              <span className="text-sm text-muted-foreground ml-1">days</span>
            </p>
          </CardContent>
        </Card>
        {/* Free: This Week */}
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium">This Week</span>
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums" data-testid="text-week-count">
              {completedThisWeek}
              <span className="text-sm text-muted-foreground ml-1">/7</span>
            </p>
          </CardContent>
        </Card>
        {/* Pro: Total Sessions */}
        {features.allStats ? (
          <Card className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Total</span>
              </div>
              <p className="text-2xl font-semibold font-mono tabular-nums" data-testid="text-total">
                {totalWorkouts}
                <span className="text-sm text-muted-foreground ml-1">sessions</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <ProGate feature="Advanced Stats">
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="text-2xl font-semibold font-mono tabular-nums">
                  {totalWorkouts}
                  <span className="text-sm text-muted-foreground ml-1">sessions</span>
                </p>
              </CardContent>
            </Card>
          </ProGate>
        )}
        {/* Pro: Time */}
        {features.allStats ? (
          <Card className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Timer className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium">Time</span>
              </div>
              <p className="text-2xl font-semibold font-mono tabular-nums" data-testid="text-minutes">
                {Math.round(totalMinutes / 60) > 0
                  ? `${Math.round(totalMinutes / 60)}h`
                  : `${totalMinutes}m`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ProGate feature="Advanced Stats">
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Timer className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium">Time</span>
                </div>
                <p className="text-2xl font-semibold font-mono tabular-nums">
                  19h
                </p>
              </CardContent>
            </Card>
          </ProGate>
        )}
      </div>

      {/* Weekly Protocol */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Weekly Protocol
        </h2>
        <div className="space-y-2">
          {PROTOCOL_DAYS.map((day) => {
            const dayWorkout = todaysWorkouts.find((w) => w.dayNumber === day.dayNumber);
            const isCompleted = dayWorkout?.completed;

            return (
              <Link key={day.dayNumber} href={`/workout/${day.dayNumber}`}>
                <Card
                  className={`border-card-border cursor-pointer transition-all hover:border-primary/30 ${
                    isCompleted ? "opacity-60" : ""
                  }`}
                  data-testid={`card-day-${day.dayNumber}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDayBgClass(
                        day.type
                      )}`}
                    >
                      {getDayIcon(day.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          Day {day.dayNumber}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {day.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm truncate">{day.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{day.focus}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
