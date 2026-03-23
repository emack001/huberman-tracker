import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// The current schedule (A = strength, B = hypertrophy) and which week we're on
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  currentSchedule: text("current_schedule").notNull().default("A"), // "A" or "B"
  scheduleStartDate: text("schedule_start_date").notNull(), // ISO date when current schedule started
});

// Workout log entries - one per workout session
export const workoutLogs = sqliteTable("workout_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // ISO date
  dayNumber: integer("day_number").notNull(), // 1-7 per Huberman protocol
  dayLabel: text("day_label").notNull(), // e.g. "Long Endurance", "Legs", etc.
  schedule: text("schedule").notNull().default("A"), // "A" or "B"
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  duration: integer("duration"), // minutes
  notes: text("notes"),
});

// Individual exercise sets logged during a workout
export const exerciseLogs = sqliteTable("exercise_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutLogId: integer("workout_log_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"), // in lbs
  rpe: integer("rpe"), // rate of perceived exertion 1-10
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

// Insert schemas
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({ id: true });

// Types
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;

// Protocol definition types (not stored in DB, used as reference data)
export interface ProtocolDay {
  dayNumber: number;
  label: string;
  type: "resistance" | "cardio" | "recovery";
  focus: string;
  description: string;
  exercises: ProtocolExercise[];
}

export interface ProtocolExercise {
  name: string;
  muscleGroup: string;
  position: "shortened" | "lengthened" | "compound" | "cardio" | "recovery";
  scheduleA: { sets: number; reps: string; rest: string };
  scheduleB: { sets: number; reps: string; rest: string };
}
