import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PROTOCOL_DAYS, getScheduleLabel } from "@/lib/protocol";
import type { Settings, WorkoutLog, ExerciseLog, ProtocolExercise } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTier } from "@/lib/tier";
import { ProGate, ProBadge } from "@/components/pro-gate";
import {
  ArrowLeft,
  Dumbbell,
  HeartPulse,
  Snowflake,
  Activity,
  Play,
  CheckCircle2,
  Clock,
  Save,
  Info,
  Lock,
} from "lucide-react";

interface SetData {
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: boolean;
}

function getDayIcon(type: string) {
  switch (type) {
    case "resistance":
      return <Dumbbell className="w-6 h-6" />;
    case "cardio":
      return <HeartPulse className="w-6 h-6" />;
    case "recovery":
      return <Snowflake className="w-6 h-6" />;
    default:
      return <Activity className="w-6 h-6" />;
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

function getPositionLabel(pos: string) {
  switch (pos) {
    case "shortened":
      return "Shortened";
    case "lengthened":
      return "Lengthened";
    case "compound":
      return "Compound";
    case "cardio":
      return "Cardio";
    case "recovery":
      return "Recovery";
    default:
      return pos;
  }
}

export default function WorkoutPage() {
  const params = useParams<{ dayNumber: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { features, isPro, promptUpgrade } = useTier();
  const dayNumber = Number(params.dayNumber);
  const day = PROTOCOL_DAYS.find((d) => d.dayNumber === dayNumber);
  const today = new Date().toISOString().split("T")[0];

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: todaysWorkouts, isLoading } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workouts/date", today],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/workouts/date/${today}`);
      return res.json();
    },
  });

  const existingWorkout = todaysWorkouts?.find((w) => w.dayNumber === dayNumber);
  const schedule = settings?.currentSchedule || "A";

  // Local state for sets
  const [sets, setSets] = useState<SetData[]>([]);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (!isStarted || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, startTime]);

  // Load existing exercise logs if workout exists
  const { data: existingExercises } = useQuery<ExerciseLog[]>({
    queryKey: ["/api/workouts", existingWorkout?.id, "exercises"],
    queryFn: async () => {
      if (!existingWorkout?.id) return [];
      const res = await apiRequest("GET", `/api/workouts/${existingWorkout.id}/exercises`);
      return res.json();
    },
    enabled: !!existingWorkout?.id,
  });

  // Initialize sets from protocol or existing data
  useEffect(() => {
    if (!day) return;

    if (existingExercises && existingExercises.length > 0) {
      setSets(
        existingExercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          muscleGroup: ex.muscleGroup,
          setNumber: ex.setNumber,
          reps: ex.reps,
          weight: ex.weight,
          rpe: ex.rpe,
          completed: !!ex.completed,
        }))
      );
      setIsStarted(true);
      if (existingWorkout?.notes) setNotes(existingWorkout.notes);
      if (existingWorkout?.duration) setDuration(existingWorkout.duration);
    } else {
      // Generate sets from protocol
      const protocolSets: SetData[] = [];
      day.exercises.forEach((exercise) => {
        const sched = schedule === "A" ? exercise.scheduleA : exercise.scheduleB;
        for (let s = 1; s <= sched.sets; s++) {
          protocolSets.push({
            exerciseName: exercise.name,
            muscleGroup: exercise.muscleGroup,
            setNumber: s,
            reps: null,
            weight: null,
            rpe: null,
            completed: false,
          });
        }
      });
      setSets(protocolSets);
    }
  }, [day, existingExercises, schedule, existingWorkout]);

  // Create workout mutation
  const createWorkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workouts", {
        date: today,
        dayNumber,
        dayLabel: day?.label || "",
        schedule,
        completed: false,
        duration: null,
        notes: "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/date", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
  });

  // Save workout mutation
  const saveWorkout = useMutation({
    mutationFn: async (markComplete: boolean) => {
      let workoutId = existingWorkout?.id;

      if (!workoutId) {
        const res = await apiRequest("POST", "/api/workouts", {
          date: today,
          dayNumber,
          dayLabel: day?.label || "",
          schedule,
          completed: markComplete,
          duration: duration || elapsed ? Math.round(elapsed / 60) : null,
          notes,
        });
        const wk = await res.json();
        workoutId = wk.id;
      } else {
        await apiRequest("PATCH", `/api/workouts/${workoutId}`, {
          completed: markComplete,
          duration: duration || (elapsed ? Math.round(elapsed / 60) : null),
          notes,
        });
      }

      // Save exercise logs
      await apiRequest("POST", `/api/workouts/${workoutId}/exercises/bulk`, sets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/date", today] });
      toast({ title: "Workout saved" });
    },
  });

  const handleStart = async () => {
    setIsStarted(true);
    setStartTime(new Date());
    if (!existingWorkout) {
      await createWorkout.mutateAsync();
    }
  };

  const handleSetUpdate = (index: number, field: keyof SetData, value: any) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!day) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Day not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Group sets by exercise
  const exerciseGroups: { exercise: ProtocolExercise; sets: { data: SetData; index: number }[] }[] = [];
  const sched = schedule === "A" ? "scheduleA" : "scheduleB";

  day.exercises.forEach((exercise) => {
    const exerciseSets = sets
      .map((s, i) => ({ data: s, index: i }))
      .filter((s) => s.data.exerciseName === exercise.name);
    if (exerciseSets.length > 0) {
      exerciseGroups.push({ exercise, sets: exerciseSets });
    }
  });

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${getDayBgClass(
            day.type
          )}`}
        >
          {getDayIcon(day.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">Day {day.dayNumber}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {day.type.toUpperCase()}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
            >
              Schedule {schedule}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold" data-testid="text-day-label">
            {day.label}
          </h1>
          <p className="text-sm text-muted-foreground">{day.focus}</p>
        </div>
        {isStarted && (
          <div className="text-right">
            <p className="text-2xl font-mono tabular-nums font-semibold" data-testid="text-timer">
              {formatTime(elapsed)}
            </p>
            <p className="text-xs text-muted-foreground">elapsed</p>
          </div>
        )}
      </div>

      {/* Protocol info */}
      <Card className="border-card-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{day.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Start button */}
      {!isStarted && !existingWorkout?.completed && (
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={handleStart}
          data-testid="button-start"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Workout
        </Button>
      )}

      {existingWorkout?.completed && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">
            Completed today
            {existingWorkout.duration ? ` in ${existingWorkout.duration} min` : ""}
          </span>
        </div>
      )}

      {/* Exercise tracking */}
      {(isStarted || existingWorkout) && (
        <div className="space-y-4">
          {exerciseGroups.map(({ exercise, sets: exerciseSets }) => {
            const schedData = exercise[sched as "scheduleA" | "scheduleB"];
            return (
              <Card key={exercise.name} className="border-card-border">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{exercise.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {exercise.muscleGroup}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getPositionLabel(exercise.position)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{schedData.sets} sets x {schedData.reps}</p>
                      <p>Rest: {schedData.rest}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {/* Table header */}
                  <div className={`grid ${features.rpeTracking ? 'grid-cols-[40px_1fr_1fr_1fr_40px]' : 'grid-cols-[40px_1fr_1fr_40px]'} gap-2 text-xs text-muted-foreground font-medium mb-2 px-1`}>
                    <span>Set</span>
                    {day.type === "resistance" ? (
                      <>
                        <span>Weight</span>
                        <span>Reps</span>
                        {features.rpeTracking && <span>RPE</span>}
                      </>
                    ) : (
                      <>
                        <span colSpan={3}>Notes</span>
                        <span></span>
                        {features.rpeTracking && <span></span>}
                      </>
                    )}
                    <span></span>
                  </div>
                  {/* RPE Pro badge in header */}
                  {!features.rpeTracking && day.type === "resistance" && (
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <button
                        onClick={() => promptUpgrade("RPE Tracking")}
                        className="flex items-center gap-1 text-[10px] text-amber-500/70 hover:text-amber-500 transition-colors"
                      >
                        <Lock className="w-3 h-3" />
                        RPE tracking available with Pro
                      </button>
                    </div>
                  )}
                  {/* Rows */}
                  {exerciseSets.map(({ data: setData, index }) => (
                    <div
                      key={index}
                      className={`grid ${features.rpeTracking ? 'grid-cols-[40px_1fr_1fr_1fr_40px]' : 'grid-cols-[40px_1fr_1fr_40px]'} gap-2 items-center py-1.5 ${
                        setData.completed ? "opacity-50" : ""
                      }`}
                      data-testid={`row-set-${exercise.name}-${setData.setNumber}`}
                    >
                      <span className="text-sm font-mono text-muted-foreground text-center">
                        {setData.setNumber}
                      </span>
                      {day.type === "resistance" ? (
                        <>
                          <Input
                            type="number"
                            placeholder="lbs"
                            value={setData.weight ?? ""}
                            onChange={(e) =>
                              handleSetUpdate(
                                index,
                                "weight",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-8 text-sm"
                            data-testid={`input-weight-${index}`}
                          />
                          <Input
                            type="number"
                            placeholder="reps"
                            value={setData.reps ?? ""}
                            onChange={(e) =>
                              handleSetUpdate(
                                index,
                                "reps",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-8 text-sm"
                            data-testid={`input-reps-${index}`}
                          />
                          {features.rpeTracking && (
                            <Input
                              type="number"
                              placeholder="1-10"
                              min={1}
                              max={10}
                              value={setData.rpe ?? ""}
                              onChange={(e) =>
                                handleSetUpdate(
                                  index,
                                  "rpe",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-8 text-sm"
                              data-testid={`input-rpe-${index}`}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <div className={`${features.rpeTracking ? 'col-span-3' : 'col-span-2'} text-xs text-muted-foreground`}>
                            {schedData.reps}
                          </div>
                        </>
                      )}
                      <div className="flex justify-center">
                        <Checkbox
                          checked={setData.completed}
                          onCheckedChange={(checked) =>
                            handleSetUpdate(index, "completed", !!checked)
                          }
                          data-testid={`checkbox-set-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Notes — Pro feature */}
          {features.sessionNotes ? (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea
                placeholder="How did this workout feel?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-notes"
              />
            </div>
          ) : (
            <ProGate feature="Session Notes">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
                <Textarea
                  placeholder="How did this workout feel?"
                  className="min-h-[80px]"
                  disabled
                />
              </div>
            </ProGate>
          )}

          {/* Save / Complete */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => saveWorkout.mutate(false)}
              disabled={saveWorkout.isPending}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button
              className="flex-1"
              onClick={() => saveWorkout.mutate(true)}
              disabled={saveWorkout.isPending}
              data-testid="button-complete"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
