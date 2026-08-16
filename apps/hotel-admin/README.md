# RoomLink Hotel Admin / GM Portal

A hotel's own workspace on RoomLink — onboarding, departments, staff, rooms, QR codes, guest
services, the restaurant menu, request monitoring/routing, and guest sessions, scoped entirely to
one hotel. Independent app and login from the Super Admin portal (`../super-admin`), sharing the
same `rmdb` database via `../../packages/db`. See `../../docs/hotel-admin/` for the full
architecture writeup, schema-change log, phase-by-phase build notes, and the navigation/permissions
reference.

## Stack

Next.js 13 (App Router) + TypeScript + Tailwind CSS, Prisma (via `@roomlink/db`), Auth.js
(credentials only — no MFA in V1), `@roomlink/ui` for shared components.

## Getting started

Run these from the **workspace root** (`../../`):

```bash
npm install
cp apps/hotel-admin/.env.example apps/hotel-admin/.env   # point DATABASE_URL at your rmdb instance, set NEXTAUTH_SECRET
npm run db:generate
npm run dev:hotel-admin       # serves on :3001 — super-admin runs on :3000
```

Sign in with a `hotel_admin` or `hotel_staff` user (`users.hotel_id` must be set, `status = 'active'`).
Two seeded pilot hotels exist for testing both PRD operating models — see
`../../packages/db/seed-pilots.sql`:

| Hotel | Login | Model |
|---|---|---|
| Pilot Hotel — 110 Room | `admin@pilot110.example` / `TestPass123!` | Department Managers assigned |
| Pilot Hotel — 15 Room | `admin@pilot15.example` / `TestPass123!` | No managers; one staff member spans 3 departments |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server on port 3001 |
| `npm run build` / `npm start` | Production build/serve |
| `npm test` | Vitest — the request status transition guard (`src/server/transitions.ts`) |
| `npm run lint` | ESLint |

## What's out of scope in V1, on purpose

- **No guest-facing UI** — `guest_sessions` (the table, service, and GM-facing list/terminate page)
  exists; the guest's own scan/PIN/request experience is a separate, not-yet-built surface. Reception
  can log a request on a guest's behalf instead (a real PRD-sanctioned path, not a workaround).
- **No PWA wrapper** — Super Admin has one (`next-pwa`); not yet ported here.
- **No email/SMS** — staff temp passwords are shown once in the UI.
- **No push notifications** — in-app alerts only (computed, not a stored notifications table — see
  `src/server/services/alerts.service.ts`).
- **CSV bulk import only** for rooms, not binary `.xlsx` parsing.
