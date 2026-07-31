# Freedive — Training Log & Table Runner

A self-hostable, mobile-first **PWA** for freedivers to log training sessions, track
personal bests, and run CO2/O2 breath-hold tables with audio cues. Built because the
freediving community lacks a good web app for recording training — especially dry
tables, where people still rely on paper, notes apps, and a separate stopwatch.

## Goals

- Replace paper/notes + stopwatch for dry training (CO2/O2 tables, STA).
- Be a proper dive log: per-session discipline, results, conditions, and notes.
- Surface motivation: auto personal bests + progress visualizations.
- Self-hostable via Docker so divers (and their buddies) can run their own instance.

## Status

Pre-scaffold. No code yet — this file documents the agreed plan.

## Tech Stack

| Layer       | Choice                         | Notes |
|-------------|--------------------------------|-------|
| Framework   | Next.js (App Router)           | One repo for UI + API routes |
| Language    | TypeScript                     | Strict data shapes (disciplines, results) |
| Database    | PostgreSQL                     | Relational: users → sessions → PBs → templates |
| ORM         | Prisma                         | Typed queries + migrations from one schema |
| Styling     | Tailwind CSS                   | Mobile-first |
| Auth        | Auth.js (NextAuth)             | Multi-user; email/password to start |
| PWA         | @ducanh2912/next-pwa           | Service worker, offline, installable |
| Audio       | Web Audio API (native)         | Generated tones, no assets, works offline |
| Charts      | Recharts                       | PB progression, etc. |
| Packaging   | Docker + docker-compose        | `docker compose up` → app + Postgres |

## Key Product Decisions

- **PWA, not native.** Sidesteps iOS App Store and Android APK distribution. One URL,
  add-to-home-screen on both platforms. (Capacitor wrapper is a v2-only option.)
- **Cues are audio tones + visual.** iOS has no web vibration API; vibration is an
  Android-only bonus. Tones chosen over voice for v1 (simple, offline, zero assets).
- **Wake Lock API** keeps the screen on during table runs to prevent locked-screen
  audio cutout.
- **Multi-user from the start** so a self-hosted instance can serve a diver + buddies.

## v1 Scope (keep it tight — avoid scope creep)

1. **Dive log** — per session: discipline (STA/DYN/DNF/CWT/FIM/CNF), result
   (time/depth/distance by discipline), date, location, buddy, water temp, EQ notes,
   how-felt notes.
2. **Auto personal bests** — computed per discipline from sessions.
3. **CO2/O2 table runner** — generate a table from the diver's static PB; run it with
   tones + Wake Lock; save runs to history.
4. **Table templates** — save / reuse / share custom tables.
5. **Charts** — PB progression line chart, training calendar heatmap, PB record cards.

### Explicitly out of scope for v1
Social feeds, coach–athlete sharing, club features, native App Store builds.

## Data Model (sketch)

```
User
 ├─ TrainingSession  (discipline, date, location, buddy, waterTemp, result, eqNotes, feltNotes)
 ├─ PersonalBest     (auto-computed per discipline)
 ├─ TableTemplate    (type CO2|O2, rounds[]{holdSec, breatheSec}, basedOnPB, isShared)
 └─ TableRun         (a completed run of a template — history + charts)
```

Result type varies by discipline: STA → time; DYN/DNF → distance; CWT/FIM → depth.

## Charts (v1 priorities)

- **PB progression line chart** — one line per discipline over time (the motivation chart).
- **Training calendar heatmap** — GitHub-style consistency view.
- **PB record cards** — bold, screenshot-able "STA PB 4:12 · set 2026-06-10".

## Suggested Build Order

1. Scaffold (Next.js + TS + Tailwind + Prisma + Postgres in Docker), app boots.
2. Multi-user auth.
3. Dive log CRUD.
4. Auto PBs + progression chart.
5. Table runner (tones + Wake Lock) — the differentiator.
6. PWA polish (manifest, offline, add-to-home-screen).

## Disciplines Reference

- **STA** — Static apnea (breath-hold time, motionless).
- **DYN** — Dynamic with fins (horizontal distance).
- **DNF** — Dynamic no fins (horizontal distance).
- **CWT** — Constant weight (depth, with fins).
- **FIM** — Free immersion (depth, pulling on a line).
- **CNF** — Constant weight no fins (depth).
