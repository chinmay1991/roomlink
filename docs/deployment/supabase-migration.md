# Deploying the RoomLink database to Supabase

This repo is an npm workspace monorepo with **one Postgres database** (`rmdb`) shared by three
Next.js apps (`apps/super-admin`, `apps/hotel-admin`, `apps/guest`) through **one** Prisma schema
(`packages/db/prisma/schema.prisma`). Moving to Supabase means pointing that one schema — and all
three apps — at Supabase's Postgres instead of your local one. Nothing about the app code changes;
only connection strings do.

Currently applied migrations, in order (this is what will get replayed onto Supabase):

```
0_init                                              — full schema, incl. `CREATE EXTENSION pgcrypto`
20260816152350_add_mfa_secret
20260816160000_hotel_admin_module
20260816170000_departments_enabled_employee_id
20260816200000_guest_session_fk_and_actor_type
```

Steps 1–2 below need your Supabase account and can't be done for you — everything from step 3
onward is a command I can run with you once you have the connection string.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Pick an org, name (e.g. `roomlink`), a **strong database password** (Supabase generates one for
   you — save it in a password manager, you'll need it below), and a region close to you.
3. Wait for provisioning (~2 minutes).

## 2. Get the connection strings

In the new project: **Project Settings → Database → Connection string**.

Supabase gives you two connection strings that matter here:

- **Connection pooling** (port `6543`, via PgBouncer, "Transaction" mode) — best for many short-lived
  connections (serverless functions, edge). It does **not** support the prepared statements/`CREATE
  TABLE`-style DDL that `prisma migrate` needs.
- **Direct connection** (port `5432`) — a normal Postgres connection. Required for running
  migrations; fine for everything else too if you're not deploying to a serverless platform.

Since all three RoomLink apps here run as long-lived Node processes (`next dev` / `next start`), not
serverless functions, **the simplest correct setup is: use the direct connection (port 5432)
everywhere** — for both migrations and runtime. Add the pooler split later only if you deploy to a
serverless/edge platform (Vercel, etc.) and start seeing "too many connections" errors.

Copy the **direct connection** string. It looks like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with the database password from step 1 (URL-encode any special characters
in it — e.g. `@` → `%40`).

## 3. Point Prisma at Supabase

`packages/db/.env` is the one file that matters for running `prisma migrate`/`prisma generate` —
update it:

```bash
# packages/db/.env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

`sslmode=require` matters — Supabase requires TLS; without it Prisma will fail to connect.

No change is needed to `packages/db/prisma/schema.prisma` — its datasource block already just reads
`env("DATABASE_URL")`.

## 4. Apply the schema to Supabase

From `packages/db`:

```bash
cd packages/db
npx prisma migrate deploy
```

`migrate deploy` (not `migrate dev`) is the right command here — it applies existing migration files
in order without trying to create a shadow database (which is what forced the manual
`migrate diff` + `psql` workaround for local migrations in this repo — see
`docs/hotel-admin/schema-changes.md`'s note on this). Against a fresh Supabase project, Prisma has
full `CREATE`/`ALTER` rights, so `migrate deploy` should just work end-to-end, including the
`CREATE EXTENSION IF NOT EXISTS "pgcrypto"` in `0_init` (Supabase's `postgres` role has the
privileges for it; the extension is usually pre-enabled on Supabase projects anyway).

Then regenerate the Prisma client (picks up nothing new here since the schema didn't change, but
confirms the toolchain is wired correctly):

```bash
npx prisma generate
```

Verify:

```bash
npx prisma migrate status
```

Should report all 5 migrations applied, database up to date.

## 5. Bring your existing local data over (optional)

If you want the seeded pilot hotels (`PILOT-15`, `PILOT-110`) and any test data you've created
carried over, rather than starting Supabase empty:

```bash
# from anywhere, with local Postgres still running
pg_dump --data-only --no-owner --no-privileges \
  "postgresql://roomlink@localhost:5432/rmdb?schema=public" \
  > roomlink_data.sql

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require" \
  < roomlink_data.sql
```

`--data-only` skips schema (already created by `migrate deploy` in step 4) and just copies rows.
Run this **after** step 4, not before — the tables need to exist first.

If you'd rather start clean, skip this and re-seed instead:

```bash
psql "$SUPABASE_DIRECT_URL" -f script.sql          # if you want the full hand-written seed
# or
psql "$SUPABASE_DIRECT_URL" -f packages/db/seed-pilots.sql   # just the two pilot hotels
```

## 6. Update every app's own `.env`

Each app resolves `DATABASE_URL` independently at runtime (via `packages/db/src/index.ts`'s shared
Prisma client, but each app's own `.env` is what Next.js actually loads). Update all three:

```bash
# apps/super-admin/.env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
# (NEXTAUTH_URL / NEXTAUTH_SECRET stay as they are — unrelated to the DB)

# apps/hotel-admin/.env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
# (NEXTAUTH_URL / NEXTAUTH_SECRET stay as they are)

# apps/guest/.env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

All four `.env` files (`packages/db` + 3 apps) should point at the **same** Supabase connection
string — same "one database, several apps" architecture this repo already uses locally
(`docs/hotel-admin/architecture.md`), just with Supabase standing in for local Postgres.

## 7. Restart and verify

```bash
# from repo root
npm run dev:super-admin   # port 3000
npm run dev:hotel-admin   # port 3001
npm run dev:guest         # port 3002
```

Log in to each with an existing seeded account (or a freshly restored one from step 5) and confirm
data loads. If you skipped step 5, the DB is schema-only and empty — you'll need to create a hotel
via Super Admin (or run the seed scripts from step 5's second option) before there's anything to see.

## 8. Secrets hygiene

- `.env` is already git-ignored in every app and in `packages/db` — confirmed before writing this
  guide (`packages/db/.gitignore` excludes it explicitly). Keep it that way; never commit the
  Supabase password.
- Update `.env.example` in each app/package with the **shape** of the connection string only (no
  real password) if you want teammates to have a template — the existing `.env.example` files
  already show the local-Postgres shape; update the comment, not a real credential, if you touch
  them.
- If you rotate the Supabase DB password later, all 4 `.env` files need updating together — there's
  no single source of truth for it beyond keeping them in sync by hand (same as today, locally).

## 8a. Views — not covered by `prisma migrate deploy`, create them separately

`script.sql` (Section 13) creates two dashboard views — `v_platform_kpis` (Super Admin dashboard
KPIs) and `v_hotel_onboarding_progress` — directly against Postgres. Prisma's schema/migrations in
this repo don't model views at all, so `prisma migrate deploy` has no way to know these exist; they
were only ever present locally because `script.sql` was run against local Postgres by hand at some
point, outside the migration history entirely. **Skipping this step breaks the Super Admin
dashboard** (`relation "v_platform_kpis" does not exist`) even though every table migrated fine.

Run this against Supabase after step 4:

```bash
psql "$SUPABASE_DIRECT_URL" <<'SQL'
CREATE OR REPLACE VIEW v_platform_kpis AS
SELECT
    (SELECT COUNT(*) FROM hotels) AS total_hotels,
    (SELECT COUNT(*) FROM hotels WHERE status = 'active') AS active_hotels,
    (SELECT COUNT(*) FROM hotels WHERE status = 'trial') AS trial_hotels,
    (SELECT COUNT(*) FROM hotels WHERE status = 'onboarding') AS onboarding_hotels,
    (SELECT COUNT(*) FROM rooms) AS total_rooms,
    (SELECT COUNT(*) FROM support_tickets WHERE status NOT IN ('resolved','closed')) AS open_support_tickets,
    (SELECT COUNT(*) FROM payments WHERE status = 'failed') AS failed_payments;

CREATE OR REPLACE VIEW v_hotel_onboarding_progress AS
SELECT
    hotel_id,
    COUNT(*) FILTER (WHERE status = 'complete')::NUMERIC / COUNT(*)::NUMERIC * 100 AS percent_complete
FROM onboarding_tracker
GROUP BY hotel_id;
SQL
```

(Or just run all of `script.sql`'s Section 13 verbatim — same effect. `CREATE OR REPLACE VIEW` makes
this safe to re-run.) Verify with `psql "$SUPABASE_DIRECT_URL" -c "\dv public.*"` — should list both.

## 9. What does *not* need to change

- `packages/db/prisma/schema.prisma` — untouched, `env("DATABASE_URL")` already does the right thing.
- Every app's Prisma usage (`src/server/db.ts` in each app) — just re-exports the shared client from
  `@roomlink/db`; it has no awareness of where the database physically lives.
- Migration files — replayed as-is via `migrate deploy`; nothing in them is Postgres-flavor-specific
  beyond standard `pgcrypto`, which Supabase supports natively.

---

## Rollback

If something goes wrong mid-migration, your local database is untouched — nothing in this process
writes back to `localhost:5432`. To retry cleanly: in the Supabase dashboard, **Database → 
Reset database** (or just delete and recreate the project), then repeat from step 4.
