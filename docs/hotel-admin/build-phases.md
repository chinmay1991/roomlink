# Hotel Admin / GM — Build Phases

All 13 phases complete. Every phase was type-checked (`tsc --noEmit`) and smoke-tested against a live
`rmdb` before moving to the next; Phases 1–12 additionally passed `next build` + `next lint` at the
end. File paths below are relative to `apps/hotel-admin/src/` unless noted otherwise.

- [x] **Phase 1 — Auth / session / tenant scoping.** `server/auth.ts`, `server/require-hotel-session.ts`,
      `server/hotel-rbac.ts`, `app/hotel/layout.tsx`, `middleware.ts`, `components/layout/{sidebar,topbar}.tsx`.
      Verified: login → session carries `hotelId` → `/hotel/dashboard` reachable; unauthenticated access
      to `/hotel/*` redirects to `/login`.

- [x] **Phase 2 — Hotel Profile + Legal/GST + onboarding tracker.**
      `server/services/{hotel-profile,hotel-onboarding}.service.ts`, `app/hotel/{profile,legal,onboarding}/`.
      Verified end-to-end via API + the onboarding checklist rendering real tracker rows.

- [x] **Phase 3 — Departments.** `server/services/departments.service.ts`,
      `app/api/v1/hotel/departments/**`, `app/hotel/departments/`. Enable-from-template, custom
      department, rename, enable/disable (preserves history — no delete). Verified incl. the 409
      conflict on a duplicate department name.

- [x] **Phase 4 — Staff + multi-department assignment + Reception.**
      `server/services/{staff,hotel-roles}.service.ts`, `app/api/v1/hotel/{staff,reception}/**`,
      `app/hotel/{staff,reception}/`. Verified the core V1 architectural requirement directly: one
      staff member assigned to two departments (Housekeeping + Maintenance) via `user_departments`,
      confirmed many-to-many, not `staff.department_id`.

- [x] **Phase 5 — Optional Department Manager.** `departments.service.ts`'s `setDepartmentManager`,
      `app/api/v1/hotel/departments/[departmentId]/manager/`, `app/hotel/managers/`. Verified
      assign → role auto-promotes to "Department Manager"; remove → role auto-reverts to "Department
      Staff" once they no longer manage any department.

- [x] **Phase 6 — Rooms.** `server/services/rooms.service.ts`, `app/api/v1/hotel/rooms/**`,
      `app/hotel/rooms/`. Create/edit/status, CSV bulk import (paste-based, room_number/floor/room_type
      per line). Verified single create + bulk import of multiple rows.

- [x] **Phase 7 — QR Codes.** `server/services/qr-codes.service.ts`, `app/api/v1/hotel/qr-codes/**`.
      Real PNG generation on demand via the `qrcode` package (nothing stored as a blob —
      `qr_codes.image_url` is far too small for a data URI). Verified: generated PNG is a real
      480×480 image; mark-installed and deactivate both work.

- [x] **Phase 8 — Guest Services.** `server/services/guest-services.service.ts`,
      `app/api/v1/hotel/services/**`, `app/hotel/services/`. Per-department quick-add suggestions
      (Housekeeping/Maintenance/Restaurant defaults from the PRD) plus custom services.

- [x] **Phase 9 — Restaurant Menu.** `server/services/menu.service.ts`, `app/api/v1/hotel/menu/**`,
      `app/hotel/menu/`. Categories + items with price, veg/non-veg, admin enable/disable distinct
      from day-to-day mark-unavailable.

- [x] **Phase 10 — Requests + Reception routing + Guest Sessions + Settings.** The centerpiece:
      `server/services/requests.service.ts` (list/filter, assign/reassign, status transitions,
      escalate, full history), `server/services/guest-sessions.service.ts`, `server/services/
      hotel-settings.service.ts`, `app/hotel/{requests,guest-sessions,settings,activity}/`. This is
      where the PRD's routing rule (Reception → Manager → Staff, or Reception → Staff if no manager)
      and the multi-department eligibility check live. **Proven end-to-end on both pilot hotels — see
      below.**

- [x] **Phase 11 — Notifications.** `server/services/alerts.service.ts`, `app/hotel/notifications/`.
      Deliberately computed/derived (unassigned requests past 15 min, escalations, rooms with no
      active QR, unavailable menu items) rather than a stored notifications table + push queue — the
      PRD explicitly says not to overbuild V1 notification infrastructure.

- [x] **Phase 12 — Dashboard.** `server/services/hotel-dashboard.service.ts`, `app/hotel/dashboard/`.
      KPI cards, department summary, alerts (shares `alerts.service.ts` with Phase 11).

- [x] **Phase 13 — Verification.** See below.

## Phase 13 in detail

**Seeded two dedicated pilot hotels** (`packages/db/seed-pilots.sql`), separate from the 4 pre-existing
demo hotels, matching the PRD exactly:

- **Pilot Hotel — 110 Room** (`PILOT-110`) — `admin@pilot110.example`. Reception, Housekeeping,
  Restaurant, Maintenance departments, all 110 rooms, a manager assigned to each of
  Housekeeping/Restaurant/Maintenance, staff under each.
- **Pilot Hotel — 15 Room** (`PILOT-15`) — `admin@pilot15.example`. Same 4 departments, all 15 rooms,
  **no managers**, one staff member ("Raju") in Housekeeping + Restaurant + Maintenance simultaneously.

**Ran the mandatory acceptance test on each, through the real API** (not a bypass script):

- **110-room, with managers**: Room 204 → QR generated → guest session issued (verification) →
  "Extra Towels" request logged against Housekeeping → Reception assigns to the Housekeeping Manager
  (Anita) → Manager reassigns to Housekeeping Staff (Sita) → started → completed. Full chain confirmed
  via `request_status_history`.
- **15-room, no managers**: "AC repair" (Maintenance) → Reception assigns directly to Raju (no manager
  exists) → completed. Then a *second* request from a *different* department — "Food ordering"
  (Restaurant) → Reception assigns to Raju again → completed. Proves the PRD's explicit closing claim
  ("the same staff account must be able to handle tasks from multiple departments") with a real,
  distinct-department second request, not just the initial multi-department staff assignment from
  Phase 4.

**Found and fixed a real tenant-isolation bug** while probing the pilots against each other — see
`schema-changes.md`'s "Cross-tenant FK validation" section. Re-verified after the fix: four cross-tenant
probes (create request with a foreign room/department, assign a foreign staff member, create staff
with a foreign department) all correctly rejected (404/403); the same legitimate same-hotel operations
still succeed.

**Test suites / build**: `apps/super-admin` — `npm test` (15/15 passing, unchanged), `next lint`
clean, `next build` clean. `apps/hotel-admin` — added `src/server/transitions.ts` (an extracted,
pure `canTransition` state-machine helper, mirroring `apps/super-admin`'s existing pattern) with
`transitions.test.ts` (6/6 passing), `next lint` clean, `next build` clean (56 routes, all compiling).

## Known scope trims (deliberate, not oversights)

- **No guest-facing UI** — confirmed decision; see `architecture.md`.
- **No PWA wrapper** (`next-pwa`, service worker, install prompt) for `apps/hotel-admin` — Super
  Admin has one; adding it here is straightforward (copy `next.config.js`'s `withPWA` wrapper +
  `scripts/generate-icons.mjs` + manifest) but was traded off against build-phase coverage this
  session.
- **No email/SMS delivery** for staff temp passwords — shown once in the UI, matching Super Admin's
  own existing "Phase 6" stub for the same thing.
- **No push notifications** — in-app only, per the PRD's explicit V1 guidance.
- **CSV bulk import only**, not binary `.xlsx` parsing — paste-based, one room per line. The PRD lists
  CSV and Excel together; a spreadsheet exported to CSV works directly.
