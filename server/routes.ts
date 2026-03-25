import type { Express } from "express";
import type { Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertWorkoutLogSchema, insertExerciseLogSchema, insertSettingsSchema } from "@shared/schema";

// ---------------------------------------------------------------------------
// Stripe client — only initialised when the secret key is present.
// In development without keys set, checkout endpoints will return 503.
// ---------------------------------------------------------------------------
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2025-01-27.acacia" }) : null;

function requireStripe(res: any): stripe is Stripe {
  if (!stripe) {
    res.status(503).json({ error: "Payment processing is not configured yet. Set STRIPE_SECRET_KEY." });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Helper: read userId from the x-user-id header
// ---------------------------------------------------------------------------
function getUserId(req: any): string | null {
  const id = req.headers["x-user-id"];
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

export function registerRoutes(server: Server, app: Express) {

  // ── Stripe webhook (must be registered BEFORE express.json middleware runs) ──
  // express.json is set to capture rawBody in server/index.ts, so we can verify here.
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: "Missing stripe-signature header or webhook secret" });
    }

    let event: Stripe.Event;
    try {
      // req.rawBody is captured in server/index.ts via the verify callback
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (!userId) break;

          // Store the Stripe customer & subscription IDs
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

          storage.upsertUser(userId, {
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
          });
          storage.setUserPro(userId, true);
          console.log(`[stripe] Pro activated for user ${userId}`);
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const user = storage.getUserByStripeSubscriptionId(sub.id);
          if (!user) break;

          const active = sub.status === "active" || sub.status === "trialing";
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : undefined;
          storage.setUserPro(user.id, active, active ? periodEnd : undefined);
          console.log(`[stripe] Subscription updated for user ${user.id}: ${sub.status}`);
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const user = storage.getUserByStripeSubscriptionId(sub.id);
          if (!user) break;
          storage.setUserPro(user.id, false);
          console.log(`[stripe] Pro revoked for user ${user.id}`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
          if (!customerId) break;
          const user = storage.getUserByStripeCustomerId(customerId);
          if (!user) break;
          // Grace: leave isPro = true until subscription.deleted fires
          console.log(`[stripe] Payment failed for customer ${customerId}`);
          break;
        }
      }
    } catch (err) {
      console.error("Error handling webhook event:", err);
    }

    res.json({ received: true });
  });

  // ── Tier check — called on app load ──────────────────────────────────────
  app.get("/api/me/tier", (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.json({ isPro: false });

    const user = storage.getUser(userId);
    if (!user) return res.json({ isPro: false });

    // Check expiry for time-boxed subscriptions
    if (user.isPro && user.proExpiresAt) {
      const expired = new Date(user.proExpiresAt) < new Date();
      if (expired) {
        storage.setUserPro(userId, false);
        return res.json({ isPro: false });
      }
    }

    res.json({ isPro: user.isPro });
  });

  // ── Create Stripe Checkout Session ───────────────────────────────────────
  app.post("/api/checkout/session", async (req, res) => {
    if (!requireStripe(res)) return;

    const { userId, plan } = req.body as { userId: string; plan: "monthly" | "yearly" };
    if (!userId || !plan) {
      return res.status(400).json({ error: "userId and plan are required" });
    }

    const priceId = plan === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId) {
      return res.status(503).json({ error: `STRIPE_PRICE_ID_${plan.toUpperCase()} env var not set` });
    }

    // Ensure the user row exists so the webhook can find them
    storage.upsertUser(userId, {});

    const appUrl = process.env.APP_URL || "https://jmrwellness.app";

    try {
      const session = await stripe!.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/?checkout=cancelled`,
        metadata: { userId },
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId },
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe session error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Stripe Customer Portal (manage / cancel subscription) ────────────────
  app.post("/api/checkout/portal", async (req, res) => {
    if (!requireStripe(res)) return;

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "x-user-id header required" });

    const user = storage.getUser(userId);
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: "No billing record found for this user" });
    }

    const appUrl = process.env.APP_URL || "https://jmrwellness.app";

    try {
      const portalSession = await stripe!.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: appUrl,
      });
      res.json({ url: portalSession.url });
    } catch (err: any) {
      console.error("Portal session error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Settings ─────────────────────────────────────────────────────────────
  app.get("/api/settings", (_req, res) => {
    const s = storage.getSettings();
    if (!s) {
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

  // ── Workout logs ─────────────────────────────────────────────────────────
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

  // ── Exercise logs ─────────────────────────────────────────────────────────
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
    storage.deleteExerciseLogsByWorkout(workoutId);
    const created = exercises
      .map((ex) => {
        const parsed = insertExerciseLogSchema.safeParse({
          ...ex,
          workoutLogId: workoutId,
        });
        if (!parsed.success) return null;
        return storage.createExerciseLog(parsed.data);
      })
      .filter(Boolean);
    res.status(201).json(created);
  });
}
