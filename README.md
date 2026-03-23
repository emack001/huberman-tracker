# JMR Wellness — Huberman Protocol Tracker

A free fitness tracker built for Dr. Andrew Huberman's Foundational Fitness Protocol. Track your 7-day training cycle with Schedule A/B periodization, per-set logging (weight, reps, RPE), built-in timer, and workout history.

## Features

**Free Tier**
- Full 7-day protocol view (3 resistance, 3 cardio, 1 recovery)
- Workout timer and per-set weight/reps tracking
- Streak and weekly completion stats
- Schedule A (Strength) workouts
- Last 2 weeks of workout history

**Pro Tier** ($4.99/mo)
- RPE tracking per set
- Schedule B (Hypertrophy) + A/B switching
- Session notes
- Full workout history
- Progress insights and data export
- Advanced dashboard stats

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js (Node.js)
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Build:** Vite (dev) + esbuild (production)

## Quick Start

```bash
npm install
npm run dev        # starts on port 5000
```

## Seed Demo Data

```bash
npx tsx seed-demo.ts
```

## Production Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Deploy to Railway

1. Connect this repo to [Railway](https://railway.com)
2. Add a Volume mounted at `/data`
3. Set environment variable: `DATABASE_PATH=/data/huberman.db`
4. Set environment variable: `NODE_ENV=production`
5. Railway auto-builds and deploys on push

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `huberman.db` | Path to SQLite database file |
| `NODE_ENV` | `development` | Set to `production` for deployment |
| `PORT` | `5000` | Server port |

## License

MIT

---

**JMR Wellness** — jmrwellness.com

*This app is an independent project. It is not affiliated with, endorsed by, or sponsored by Dr. Andrew Huberman or Huberman Lab.*
