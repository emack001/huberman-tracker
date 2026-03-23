import type { ProtocolDay } from "@shared/schema";

export const PROTOCOL_DAYS: ProtocolDay[] = [
  {
    dayNumber: 1,
    label: "Long Endurance",
    type: "cardio",
    focus: "Zone 2 Cardio",
    description: "60-75 min zone 2 cardio. Breathing faster than normal but able to hold a conversation. Nasal breathing when possible.",
    exercises: [
      {
        name: "Zone 2 Cardio",
        muscleGroup: "Cardiovascular",
        position: "cardio",
        scheduleA: { sets: 1, reps: "60-75 min", rest: "—" },
        scheduleB: { sets: 1, reps: "60-75 min", rest: "—" },
      },
    ],
  },
  {
    dayNumber: 2,
    label: "Legs",
    type: "resistance",
    focus: "Quads, Hamstrings, Calves",
    description: "Leg resistance training. 10 min warm-up + 50-60 min training. Two exercises per muscle group: one shortened position, one lengthened.",
    exercises: [
      {
        name: "Leg Extensions",
        muscleGroup: "Quadriceps",
        position: "shortened",
        scheduleA: { sets: 4, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Hack Squat / Deep Squat",
        muscleGroup: "Quadriceps",
        position: "lengthened",
        scheduleA: { sets: 4, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Seated Leg Curl",
        muscleGroup: "Hamstrings",
        position: "shortened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Glute-Ham Raise / RDL",
        muscleGroup: "Hamstrings",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Seated Calf Raise",
        muscleGroup: "Calves",
        position: "shortened",
        scheduleA: { sets: 3, reps: "6-10", rest: "2 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Standing Calf Raise",
        muscleGroup: "Calves",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "6-10", rest: "2 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
    ],
  },
  {
    dayNumber: 3,
    label: "Recovery",
    type: "recovery",
    focus: "Heat & Cold Exposure",
    description: "Deliberate heat (sauna 20 min) + cold exposure (1-5 min cold plunge/shower). 3-5 rounds. Optional: light walking, stretching.",
    exercises: [
      {
        name: "Sauna / Heat Exposure",
        muscleGroup: "Recovery",
        position: "recovery",
        scheduleA: { sets: 5, reps: "20 min heat + 5 min cold", rest: "—" },
        scheduleB: { sets: 5, reps: "20 min heat + 5 min cold", rest: "—" },
      },
    ],
  },
  {
    dayNumber: 4,
    label: "Torso",
    type: "resistance",
    focus: "Chest, Back, Shoulders, Neck",
    description: "Push-pull supersets for torso. 10 min warm-up + 50-60 min. Two exercises per muscle group.",
    exercises: [
      {
        name: "Cable Crossover / Chest Fly",
        muscleGroup: "Chest",
        position: "shortened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Incline Dumbbell Press",
        muscleGroup: "Chest",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Chin-Up / Lat Pulldown",
        muscleGroup: "Back",
        position: "shortened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Dumbbell Row",
        muscleGroup: "Back",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Lateral Raise",
        muscleGroup: "Shoulders",
        position: "shortened",
        scheduleA: { sets: 3, reps: "6-10", rest: "2 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Overhead Press",
        muscleGroup: "Shoulders",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Neck Curl / Extension",
        muscleGroup: "Neck",
        position: "compound",
        scheduleA: { sets: 4, reps: "6-10", rest: "90 sec" },
        scheduleB: { sets: 3, reps: "10-15", rest: "60 sec" },
      },
    ],
  },
  {
    dayNumber: 5,
    label: "Moderate Cardio",
    type: "cardio",
    focus: "75-80% Effort",
    description: "35 min moderate-intensity cardio at 75-80% max effort. Running, rowing, cycling, stair climbing, or jump rope.",
    exercises: [
      {
        name: "Moderate Intensity Cardio",
        muscleGroup: "Cardiovascular",
        position: "cardio",
        scheduleA: { sets: 1, reps: "35 min @ 75-80%", rest: "—" },
        scheduleB: { sets: 1, reps: "35 min @ 75-80%", rest: "—" },
      },
    ],
  },
  {
    dayNumber: 6,
    label: "HIIT",
    type: "cardio",
    focus: "Sprint Intervals",
    description: "8-12 rounds of 20-30 sec all-out sprints + 10 sec rest. Assault bike, rowing, running, or ski machine.",
    exercises: [
      {
        name: "Sprint Intervals",
        muscleGroup: "Cardiovascular",
        position: "cardio",
        scheduleA: { sets: 12, reps: "20-30 sec sprint + 10 sec rest", rest: "10 sec" },
        scheduleB: { sets: 8, reps: "20-30 sec sprint + 10 sec rest", rest: "10 sec" },
      },
    ],
  },
  {
    dayNumber: 7,
    label: "Arms & Calves",
    type: "resistance",
    focus: "Biceps, Triceps, Calves, Neck",
    description: "Smaller muscle groups. 10 min warm-up + 50-60 min. Two exercises per muscle group.",
    exercises: [
      {
        name: "Preacher Curl",
        muscleGroup: "Biceps",
        position: "shortened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Incline Dumbbell Curl",
        muscleGroup: "Biceps",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Cable Tricep Pushdown",
        muscleGroup: "Triceps",
        position: "shortened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Overhead Tricep Extension",
        muscleGroup: "Triceps",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "4-8", rest: "2-4 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Seated Calf Raise",
        muscleGroup: "Calves",
        position: "shortened",
        scheduleA: { sets: 3, reps: "6-10", rest: "2 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Standing Calf Raise",
        muscleGroup: "Calves",
        position: "lengthened",
        scheduleA: { sets: 3, reps: "6-10", rest: "2 min" },
        scheduleB: { sets: 3, reps: "8-15", rest: "90 sec" },
      },
      {
        name: "Neck Curl / Extension",
        muscleGroup: "Neck",
        position: "compound",
        scheduleA: { sets: 4, reps: "6-10", rest: "90 sec" },
        scheduleB: { sets: 3, reps: "10-15", rest: "60 sec" },
      },
    ],
  },
];

export function getDayIcon(type: string): string {
  switch (type) {
    case "resistance": return "dumbbell";
    case "cardio": return "heart-pulse";
    case "recovery": return "snowflake";
    default: return "activity";
  }
}

export function getDayColor(dayNumber: number): string {
  const colors: Record<number, string> = {
    1: "text-blue-500",
    2: "text-orange-500",
    3: "text-cyan-400",
    4: "text-red-500",
    5: "text-green-500",
    6: "text-yellow-500",
    7: "text-purple-500",
  };
  return colors[dayNumber] || "text-primary";
}

export function getScheduleLabel(schedule: string): string {
  return schedule === "A" ? "Strength (4-8 reps, heavy)" : "Hypertrophy (8-15 reps, moderate)";
}
