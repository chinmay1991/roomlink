# RoomLink Super Admin Portal

RoomLink HQ's command center — create hotel workspaces, manage subscriptions and billing, track onboarding, run support, and view platform analytics. Built against the `rmdb` PostgreSQL schema, now managed centrally in `../../packages/db` and shared with `../hotel-admin` (see `../../docs/hotel-admin/architecture.md`). The original raw-SQL source (`../../script.sql`) and narrative reference (`../../docs/RoomLink Schema.md`) predate that move and are kept for history — `packages/db/prisma/schema.prisma` is the current source of truth.

## Stack

Next.js 13 (App Router) + TypeScript + Tailwind CSS, Prisma, Auth.js (credentials + optional TOTP 2FA), installable as a PWA.

Pinned to older major versions of a few packages (`next@13.5.11`, `prisma@5`, `vitest@1`, `otplib@12`) because this environment runs Node 18.16, and their current majors require Node ≥20. Upgrade Node first if you want to move onto the latest Next.js/Prisma.

## Getting started

Run these from the **workspace root** (`../../`), not this directory — it's an npm workspace member:

```bash
npm install                        # installs all apps/packages at once
cp apps/super-admin/.env.example apps/super-admin/.env   # point DATABASE_URL at your rmdb instance, set NEXTAUTH_SECRET
npm run db:generate                # generates the shared Prisma client (packages/db)
npm run dev:super-admin            # or: cd apps/super-admin && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a `super_admin` or `support_staff` user from the `users` table (password hashes are bcrypt — created either via this app or via Postgres's `crypt(password, gen_salt('bf'))`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server (PWA service worker disabled in dev) |
| `npm run build` / `npm start` | Production build/serve (generates `public/sw.js`) |
| `npm test` | Vitest — currently covers the subscription/invoice/ticket state-machine guards and the MRR calculation |
| `npm run lint` | ESLint |
| `npm run generate-icons` | Regenerates `public/icons/*.png` (dependency-free PNG encoder — no sharp/ImageMagick needed) |

## Database changes

The schema now lives in `../../packages/db/prisma/schema.prisma` — shared with `apps/hotel-admin`, not local to this app. To change it, run these from `packages/db`:

```bash
# edit prisma/schema.prisma, then either:
npx prisma migrate dev --name your_change   # if your DB user has CREATEDB (shadow DB)
# or, if it doesn't (this project's local roomlink user doesn't):
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_your_change/migration.sql
psql "$DATABASE_URL" -f prisma/migrations/<timestamp>_your_change/migration.sql
npx prisma migrate resolve --applied <timestamp>_your_change
npx prisma generate   # regenerates the client both apps consume from @roomlink/db
```

## What's stubbed, on purpose

- **Email/SMS** (`src/server/notifications`) — logs to the server console unless `RESEND_API_KEY`/`RESEND_FROM_EMAIL` are set. Invite and password-reset flows still show the temp password in the UI either way.
- **Integration secrets** (`/integrations`) — the `integrations.config` column only ever stores non-secret notes. Real API keys belong in environment variables.
- **Voice call metrics** (`/analytics`) — no `voice_calls` table exists yet; shown as "Coming soon."
- **Rate limiting** (`src/server/rate-limit.ts`) — in-memory, so it only works for a single long-running Node process. A multi-instance/serverless deploy needs a shared store (Redis/Upstash) instead.
