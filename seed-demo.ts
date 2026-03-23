/**
 * Demo Seed Script — Huberman Strength Protocol Tracker
 * 
 * Populates 3 weeks of realistic workout history with:
 * - Schedule A (Strength) for first 2 weeks, then switches to Schedule B
 * - Progressive overload on weights
 * - Realistic RPE values, durations, and session notes
 * - A streak leading up to today (March 21, 2026)
 * - Some missed days for realism
 */

import Database from "better-sqlite3";

const db = new Database("huberman.db");

// Clear existing data
db.exec("DELETE FROM exercise_logs");
db.exec("DELETE FROM workout_logs");
db.exec("DELETE FROM settings");

// Set settings: currently on Schedule A, started 18 days ago
const scheduleStartDate = "2026-03-03";
db.prepare("INSERT INTO settings (current_schedule, schedule_start_date) VALUES (?, ?)").run("A", scheduleStartDate);

// ──────────────────────────────────────────────
// Protocol reference data
// ──────────────────────────────────────────────

interface DayDef {
  dayNumber: number;
  label: string;
  type: "resistance" | "cardio" | "recovery";
  exercises: ExDef[];
}

interface ExDef {
  name: string;
  muscleGroup: string;
  setsA: number;
  setsB: number;
}

const DAYS: DayDef[] = [
  {
    dayNumber: 1, label: "Long Endurance", type: "cardio",
    exercises: [{ name: "Zone 2 Cardio", muscleGroup: "Cardiovascular", setsA: 1, setsB: 1 }],
  },
  {
    dayNumber: 2, label: "Legs", type: "resistance",
    exercises: [
      { name: "Leg Extensions", muscleGroup: "Quadriceps", setsA: 4, setsB: 3 },
      { name: "Hack Squat / Deep Squat", muscleGroup: "Quadriceps", setsA: 4, setsB: 3 },
      { name: "Seated Leg Curl", muscleGroup: "Hamstrings", setsA: 3, setsB: 3 },
      { name: "Glute-Ham Raise / RDL", muscleGroup: "Hamstrings", setsA: 3, setsB: 3 },
      { name: "Seated Calf Raise", muscleGroup: "Calves", setsA: 3, setsB: 3 },
      { name: "Standing Calf Raise", muscleGroup: "Calves", setsA: 3, setsB: 3 },
    ],
  },
  {
    dayNumber: 3, label: "Recovery", type: "recovery",
    exercises: [{ name: "Sauna / Heat Exposure", muscleGroup: "Recovery", setsA: 5, setsB: 5 }],
  },
  {
    dayNumber: 4, label: "Torso", type: "resistance",
    exercises: [
      { name: "Cable Crossover / Chest Fly", muscleGroup: "Chest", setsA: 3, setsB: 3 },
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", setsA: 3, setsB: 3 },
      { name: "Chin-Up / Lat Pulldown", muscleGroup: "Back", setsA: 3, setsB: 3 },
      { name: "Dumbbell Row", muscleGroup: "Back", setsA: 3, setsB: 3 },
      { name: "Lateral Raise", muscleGroup: "Shoulders", setsA: 3, setsB: 3 },
      { name: "Overhead Press", muscleGroup: "Shoulders", setsA: 3, setsB: 3 },
      { name: "Neck Curl / Extension", muscleGroup: "Neck", setsA: 4, setsB: 3 },
    ],
  },
  {
    dayNumber: 5, label: "Moderate Cardio", type: "cardio",
    exercises: [{ name: "Moderate Intensity Cardio", muscleGroup: "Cardiovascular", setsA: 1, setsB: 1 }],
  },
  {
    dayNumber: 6, label: "HIIT", type: "cardio",
    exercises: [{ name: "Sprint Intervals", muscleGroup: "Cardiovascular", setsA: 12, setsB: 8 }],
  },
  {
    dayNumber: 7, label: "Arms & Calves", type: "resistance",
    exercises: [
      { name: "Preacher Curl", muscleGroup: "Biceps", setsA: 3, setsB: 3 },
      { name: "Incline Dumbbell Curl", muscleGroup: "Biceps", setsA: 3, setsB: 3 },
      { name: "Cable Tricep Pushdown", muscleGroup: "Triceps", setsA: 3, setsB: 3 },
      { name: "Overhead Tricep Extension", muscleGroup: "Triceps", setsA: 3, setsB: 3 },
      { name: "Seated Calf Raise", muscleGroup: "Calves", setsA: 3, setsB: 3 },
      { name: "Standing Calf Raise", muscleGroup: "Calves", setsA: 3, setsB: 3 },
      { name: "Neck Curl / Extension", muscleGroup: "Neck", setsA: 4, setsB: 3 },
    ],
  },
];

// ──────────────────────────────────────────────
// Baseline weights per exercise (Schedule A)
// ──────────────────────────────────────────────

const BASELINE_WEIGHTS: Record<string, number> = {
  "Leg Extensions": 120,
  "Hack Squat / Deep Squat": 185,
  "Seated Leg Curl": 90,
  "Glute-Ham Raise / RDL": 135,
  "Seated Calf Raise": 90,
  "Standing Calf Raise": 135,
  "Cable Crossover / Chest Fly": 30,
  "Incline Dumbbell Press": 60,
  "Chin-Up / Lat Pulldown": 140,
  "Dumbbell Row": 65,
  "Lateral Raise": 20,
  "Overhead Press": 95,
  "Neck Curl / Extension": 25,
  "Preacher Curl": 55,
  "Incline Dumbbell Curl": 30,
  "Cable Tricep Pushdown": 50,
  "Overhead Tricep Extension": 40,
};

// ──────────────────────────────────────────────
// Session notes pool
// ──────────────────────────────────────────────

const NOTES_POOL: Record<string, string[]> = {
  "Long Endurance": [
    "Solid zone 2 run, held conversational pace the whole time. Felt really good after.",
    "65 min jog around the lake. Tried to maintain nasal breathing for the first 40 min.",
    "Rucking with 25 lb vest today instead of jogging. Legs were a bit heavy from yesterday.",
  ],
  "Legs": [
    "Good session. Hit a new PR on hack squat. Calves were toast by the end.",
    "Focused on slow eccentrics today. Legs felt shaky walking out of the gym.",
    "Solid leg day. Added 5 lbs to leg extensions from last week.",
  ],
  "Recovery": [
    "3 rounds of 20 min sauna / 3 min cold plunge. Felt incredible afterwards.",
    "Used the gym steam room + cold shower since no sauna available. Still got the contrast effect.",
    "Full protocol: 5 rounds. Meditation in the sauna. Best recovery session yet.",
  ],
  "Torso": [
    "Push-pull supersets felt efficient. Got the whole workout done in 52 minutes.",
    "Focused on the mind-muscle connection with lat pulldowns. Huge difference.",
    "Added neck work at the end. Shoulders felt pumped.",
  ],
  "Moderate Cardio": [
    "35 min on the rowing machine at ~78% effort. HR averaged 155 bpm.",
    "Stair climber today. Tough but effective. Legs were a little sore from Monday.",
    "Jump rope intervals + jogging. Mixed it up for variety.",
  ],
  "HIIT": [
    "10 rounds on the assault bike. Absolutely brutal. Last 3 rounds were a mental battle.",
    "8 rounds of 30 sec rowing sprints. Kept good form throughout.",
    "12 rounds of sprint/jog. Hit max heart rate on round 7.",
  ],
  "Arms & Calves": [
    "Great pump day. Bicep curls felt strong. Tricep pushdowns at a new weight.",
    "Focused on time under tension. Slower reps, more burn.",
    "Calves are finally growing with the seated/standing combo. Neck work felt solid.",
  ],
};

// ──────────────────────────────────────────────
// Workout generation plan
// ──────────────────────────────────────────────

// 3 weeks of data: March 1-21, 2026
// Week 1: Mar 1 (Sun) - Mar 7 (Sat) — Schedule A — skip Day 3
// Week 2: Mar 8 (Sun) - Mar 14 (Sat) — Schedule A — full week
// Week 3: Mar 15 (Sun) - Mar 21 (Sat) — Schedule A — up to today (Sat), skip Day 6

interface PlannedWorkout {
  date: string;
  dayNumber: number;
  schedule: "A" | "B";
  weekIndex: number; // 0-2 for progressive overload
}

const plan: PlannedWorkout[] = [
  // Week 1 (Mar 1-7)
  { date: "2026-03-01", dayNumber: 1, schedule: "A", weekIndex: 0 },
  { date: "2026-03-02", dayNumber: 2, schedule: "A", weekIndex: 0 },
  // Day 3 skipped (busy day)
  { date: "2026-03-04", dayNumber: 4, schedule: "A", weekIndex: 0 },
  { date: "2026-03-05", dayNumber: 5, schedule: "A", weekIndex: 0 },
  { date: "2026-03-06", dayNumber: 6, schedule: "A", weekIndex: 0 },
  { date: "2026-03-07", dayNumber: 7, schedule: "A", weekIndex: 0 },

  // Week 2 (Mar 8-14) — full week
  { date: "2026-03-08", dayNumber: 1, schedule: "A", weekIndex: 1 },
  { date: "2026-03-09", dayNumber: 2, schedule: "A", weekIndex: 1 },
  { date: "2026-03-10", dayNumber: 3, schedule: "A", weekIndex: 1 },
  { date: "2026-03-11", dayNumber: 4, schedule: "A", weekIndex: 1 },
  { date: "2026-03-12", dayNumber: 5, schedule: "A", weekIndex: 1 },
  { date: "2026-03-13", dayNumber: 6, schedule: "A", weekIndex: 1 },
  { date: "2026-03-14", dayNumber: 7, schedule: "A", weekIndex: 1 },

  // Week 3 (Mar 15-21) — skip HIIT (Day 6)
  { date: "2026-03-15", dayNumber: 1, schedule: "A", weekIndex: 2 },
  { date: "2026-03-16", dayNumber: 2, schedule: "A", weekIndex: 2 },
  { date: "2026-03-17", dayNumber: 3, schedule: "A", weekIndex: 2 },
  { date: "2026-03-18", dayNumber: 4, schedule: "A", weekIndex: 2 },
  { date: "2026-03-19", dayNumber: 5, schedule: "A", weekIndex: 2 },
  // Day 6 skipped
  { date: "2026-03-21", dayNumber: 7, schedule: "A", weekIndex: 2 },
];

// ──────────────────────────────────────────────
// Insert data
// ──────────────────────────────────────────────

const insertWorkout = db.prepare(
  `INSERT INTO workout_logs (date, day_number, day_label, schedule, completed, duration, notes)
   VALUES (?, ?, ?, ?, 1, ?, ?)`
);

const insertExercise = db.prepare(
  `INSERT INTO exercise_logs (workout_log_id, exercise_name, muscle_group, set_number, reps, weight, rpe, completed)
   VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
);

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickNote(label: string, weekIndex: number): string {
  const pool = NOTES_POOL[label] || ["Good session."];
  return pool[weekIndex % pool.length];
}

function getDuration(type: string): number {
  switch (type) {
    case "resistance": return randInt(48, 62);
    case "cardio": return randInt(28, 70);
    case "recovery": return randInt(60, 90);
    default: return 55;
  }
}

let totalWorkouts = 0;
let totalExercises = 0;

for (const pw of plan) {
  const dayDef = DAYS.find((d) => d.dayNumber === pw.dayNumber)!;
  const duration = getDuration(dayDef.type);
  const note = pickNote(dayDef.label, pw.weekIndex);

  const result = insertWorkout.run(
    pw.date,
    pw.dayNumber,
    dayDef.label,
    pw.schedule,
    duration,
    note,
  );
  const workoutId = result.lastInsertRowid;
  totalWorkouts++;

  // Generate exercise logs for resistance days
  if (dayDef.type === "resistance") {
    for (const ex of dayDef.exercises) {
      const numSets = pw.schedule === "A" ? ex.setsA : ex.setsB;
      const baseWeight = BASELINE_WEIGHTS[ex.name] || 50;
      // Progressive overload: +5 lbs per week
      const weekWeight = baseWeight + pw.weekIndex * 5;

      for (let s = 1; s <= numSets; s++) {
        // Schedule A: 4-8 reps; slight fatigue on later sets
        const reps = Math.max(4, randInt(5, 8) - Math.floor(s / 3));
        // Weight drops slightly on later sets
        const setWeight = s <= 2 ? weekWeight : weekWeight - 5;
        // RPE increases through sets
        const rpe = Math.min(10, randInt(7, 8) + Math.floor(s / 2));

        insertExercise.run(workoutId, ex.name, ex.muscleGroup, s, reps, setWeight, rpe);
        totalExercises++;
      }
    }
  } else if (dayDef.type === "cardio") {
    // Cardio: just log sets as completed (no weight/reps data needed but add for completeness)
    for (const ex of dayDef.exercises) {
      const numSets = pw.schedule === "A" ? ex.setsA : ex.setsB;
      for (let s = 1; s <= numSets; s++) {
        insertExercise.run(workoutId, ex.name, ex.muscleGroup, s, null, null, null);
        totalExercises++;
      }
    }
  } else {
    // Recovery
    for (const ex of dayDef.exercises) {
      const numSets = pw.schedule === "A" ? ex.setsA : ex.setsB;
      for (let s = 1; s <= numSets; s++) {
        insertExercise.run(workoutId, ex.name, ex.muscleGroup, s, null, null, null);
        totalExercises++;
      }
    }
  }
}

console.log(`\n✅ Demo seed complete!`);
console.log(`   ${totalWorkouts} workout sessions created`);
console.log(`   ${totalExercises} exercise log entries created`);
console.log(`   Schedule: A (Strength) — started ${scheduleStartDate}`);
console.log(`   Date range: 2026-03-01 to 2026-03-21`);
console.log(`   Skipped days: Day 3 (week 1), Day 6 (week 3) — realistic missed sessions\n`);

db.close();
