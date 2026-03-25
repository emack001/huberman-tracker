import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  settings,
  users,
  workoutLogs,
  exerciseLogs,
  type Settings,
  type InsertSettings,
  type User,
  type WorkoutLog,
  type InsertWorkoutLog,
  type ExerciseLog,
  type InsertExerciseLog,
} from "@shared/schema";

const dbPath = process.env.DATABASE_PATH || "huberman.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    current_schedule TEXT NOT NULL DEFAULT 'A',
    schedule_start_date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_pro INTEGER NOT NULL DEFAULT 0,
    pro_expires_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    day_label TEXT NOT NULL,
    schedule TEXT NOT NULL DEFAULT 'A',
    completed INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS exercise_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_log_id INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    rpe INTEGER,
    completed INTEGER NOT NULL DEFAULT 0
  );
`);

export interface IStorage {
  // Settings
  getSettings(): Settings | undefined;
  upsertSettings(data: InsertSettings): Settings;

  // Users / tier
  getUser(id: string): User | undefined;
  upsertUser(id: string, data: Partial<Omit<User, "id">>): User;
  getUserByStripeCustomerId(customerId: string): User | undefined;
  getUserByStripeSubscriptionId(subscriptionId: string): User | undefined;
  setUserPro(id: string, isPro: boolean, expiresAt?: string): void;

  // Workout logs
  getWorkoutLogs(): WorkoutLog[];
  getWorkoutLogsByDate(date: string): WorkoutLog[];
  getWorkoutLog(id: number): WorkoutLog | undefined;
  createWorkoutLog(data: InsertWorkoutLog): WorkoutLog;
  updateWorkoutLog(id: number, data: Partial<InsertWorkoutLog>): WorkoutLog | undefined;
  deleteWorkoutLog(id: number): void;

  // Exercise logs
  getExerciseLogsByWorkout(workoutLogId: number): ExerciseLog[];
  createExerciseLog(data: InsertExerciseLog): ExerciseLog;
  updateExerciseLog(id: number, data: Partial<InsertExerciseLog>): ExerciseLog | undefined;
  deleteExerciseLogsByWorkout(workoutLogId: number): void;
}

export class DatabaseStorage implements IStorage {
  // Settings
  getSettings(): Settings | undefined {
    return db.select().from(settings).get();
  }

  upsertSettings(data: InsertSettings): Settings {
    const existing = this.getSettings();
    if (existing) {
      db.update(settings)
        .set(data)
        .where(eq(settings.id, existing.id))
        .run();
      return db.select().from(settings).where(eq(settings.id, existing.id)).get()!;
    }
    return db.insert(settings).values(data).returning().get();
  }

  // Users
  getUser(id: string): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  upsertUser(id: string, data: Partial<Omit<User, "id">>): User {
    const existing = this.getUser(id);
    if (existing) {
      if (Object.keys(data).length > 0) {
        db.update(users).set(data).where(eq(users.id, id)).run();
      }
      return db.select().from(users).where(eq(users.id, id)).get()!;
    }
    const newUser = {
      id,
      createdAt: new Date().toISOString(),
      isPro: false,
      ...data,
    };
    return db.insert(users).values(newUser).returning().get();
  }

  getUserByStripeCustomerId(customerId: string): User | undefined {
    return db.select().from(users).where(eq(users.stripeCustomerId, customerId)).get();
  }

  getUserByStripeSubscriptionId(subscriptionId: string): User | undefined {
    return db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).get();
  }

  setUserPro(id: string, isPro: boolean, expiresAt?: string): void {
    // Ensure the user row exists before updating
    this.upsertUser(id, {});
    db.update(users)
      .set({ isPro, proExpiresAt: expiresAt ?? null })
      .where(eq(users.id, id))
      .run();
  }

  // Workout logs
  getWorkoutLogs(): WorkoutLog[] {
    return db.select().from(workoutLogs).orderBy(desc(workoutLogs.date)).all();
  }

  getWorkoutLogsByDate(date: string): WorkoutLog[] {
    return db.select().from(workoutLogs).where(eq(workoutLogs.date, date)).all();
  }

  getWorkoutLog(id: number): WorkoutLog | undefined {
    return db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).get();
  }

  createWorkoutLog(data: InsertWorkoutLog): WorkoutLog {
    return db.insert(workoutLogs).values(data).returning().get();
  }

  updateWorkoutLog(id: number, data: Partial<InsertWorkoutLog>): WorkoutLog | undefined {
    db.update(workoutLogs).set(data).where(eq(workoutLogs.id, id)).run();
    return db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).get();
  }

  deleteWorkoutLog(id: number): void {
    this.deleteExerciseLogsByWorkout(id);
    db.delete(workoutLogs).where(eq(workoutLogs.id, id)).run();
  }

  // Exercise logs
  getExerciseLogsByWorkout(workoutLogId: number): ExerciseLog[] {
    return db
      .select()
      .from(exerciseLogs)
      .where(eq(exerciseLogs.workoutLogId, workoutLogId))
      .all();
  }

  createExerciseLog(data: InsertExerciseLog): ExerciseLog {
    return db.insert(exerciseLogs).values(data).returning().get();
  }

  updateExerciseLog(id: number, data: Partial<InsertExerciseLog>): ExerciseLog | undefined {
    db.update(exerciseLogs).set(data).where(eq(exerciseLogs.id, id)).run();
    return db.select().from(exerciseLogs).where(eq(exerciseLogs.id, id)).get();
  }

  deleteExerciseLogsByWorkout(workoutLogId: number): void {
    db.delete(exerciseLogs).where(eq(exerciseLogs.workoutLogId, workoutLogId)).run();
  }
}

export const storage = new DatabaseStorage();
