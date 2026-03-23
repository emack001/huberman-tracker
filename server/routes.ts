import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertWorkoutLogSchema, insertExerciseLogSchema, insertSettingsSchema } from "@shared/schema";

export function registerRoutes(server: Server, app: Express) {
  // Settings
  app.get("/api/settings", (_req, res) => {
    const s = storage.getSettings();
    if (!s) {
      // Default settings
      const newSettings = storage.upsertSettings({
        currentSchedule: "A",
        scheduleStartDate: new Date().toISOString().split("T")[0],
      });
      return res.json(newSettings);
    }
    res.json(s);
  });

  app.put("/api/settings", (req, res) => {
    const parsed = insertSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const updated = storage.upsertSettings(parsed.data);
    res.json(updated);
  });

  // Workout logs
  app.get("/api/workouts", (_req, res) => {
    res.json(storage.getWorkoutLogs());
  });

  app.get("/api/workouts/date/:date", (req, res) => {
    res.json(storage.getWorkoutLogsByDate(req.params.date));
  });

  app.get("/api/workouts/:id", (req, res) => {
    const workout = storage.getWorkoutLog(Number(req.params.id));
    if (!workout) return res.status(404).json({ error: "Not found" });
    res.json(workout);
  });

  app.post("/api/workouts", (req, res) => {
    const parsed = insertWorkoutLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const workout = storage.createWorkoutLog(parsed.data);
    res.status(201).json(workout);
  });

  app.patch("/api/workouts/:id", (req, res) => {
    const updated = storage.updateWorkoutLog(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/workouts/:id", (req, res) => {
    storage.deleteWorkoutLog(Number(req.params.id));
    res.status(204).send();
  });

  // Exercise logs
  app.get("/api/workouts/:workoutId/exercises", (req, res) => {
    res.json(storage.getExerciseLogsByWorkout(Number(req.params.workoutId)));
  });

  app.post("/api/workouts/:workoutId/exercises", (req, res) => {
    const parsed = insertExerciseLogSchema.safeParse({
      ...req.body,
      workoutLogId: Number(req.params.workoutId),
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const log = storage.createExerciseLog(parsed.data);
    res.status(201).json(log);
  });

  app.patch("/api/exercises/:id", (req, res) => {
    const updated = storage.updateExerciseLog(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // Bulk create exercise logs for a workout
  app.post("/api/workouts/:workoutId/exercises/bulk", (req, res) => {
    const workoutId = Number(req.params.workoutId);
    const exercises = req.body as Array<any>;
    // Delete existing
    storage.deleteExerciseLogsByWorkout(workoutId);
    // Create new
    const created = exercises.map((ex) => {
      const parsed = insertExerciseLogSchema.safeParse({
        ...ex,
        workoutLogId: workoutId,
      });
      if (!parsed.success) return null;
      return storage.createExerciseLog(parsed.data);
    }).filter(Boolean);
    res.status(201).json(created);
  });
}
