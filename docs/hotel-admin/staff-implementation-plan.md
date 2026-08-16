# Hotel Department Staff — Implementation Plan

Status: **built and verified** (2026-08-16), approved after being written against the PRD
(`docs/RoomLink_V1_Department_Staff_PRD.pdf`, V1.0) and inspecting the already-built Super
Admin, Hotel Admin/GM, and Department Manager modules, per the PRD's own §31 process. See §12 for
the verification run.

## 1. Objective

Give the mandatory "Department Staff" role (already exists as a role name and login path — see §2)
a focused, mobile-first, task-execution experience: see the requests belonging to whichever
department(s) they're currently assigned to, self-accept unclaimed work, and move it through
Start → Complete — without any hotel-wide visibility or configuration authority.

## 2. Decision: extend `apps/hotel-admin`, not a new app

Same call the Department Manager module made (`department-manager-plan.md` §2), for the same
reason — PRD §16 that document quotes ("one architecture, no forks") is this app's own founding
principle (`architecture.md`), not this PRD's, but this PRD converges on it independently: Rule 4
("Staff can access ONLY their own hotel"), the explicit "DO NOT create a separate authentication
system" instruction, and "use the EXISTING RoomLink PostgreSQL schema" all point at the same app.

`apps/hotel-admin` already has, and this module reuses as-is:

- A `hotel_staff` login (`server/auth.ts`) that issues a session carrying
  `{ id, userType, roleId, roleName, hotelId }` — `roleName === 'Department Staff'` is already a
  real, reachable value (`hotel-roles.service.ts`'s `HOTEL_STAFF_ROLE_NAMES`), seeded with its own
  `role_permissions` grants (`hotel_dashboard: view`, `hotel_requests: view, edit`,
  `hotel_notifications: view`).
- `user_departments` — the exact multi-department membership table PRD §6/§25 needs, already
  populated by `staff.service.ts`'s `createStaff`/`setStaffDepartments`.
- The request lifecycle (`request_status` enum: `pending → assigned → in_progress → completed`,
  plus `cancelled`/`escalated`) and `REQUEST_TRANSITIONS` (`transitions.ts`) that already encode
  PRD §10's workflow almost exactly: `pending`=NEW, `assigned`=ACCEPTED, `in_progress`, `completed`.
- `assertCanWorkRequest` (`requests.service.ts`) — already lets whoever a request is
  `assigned_to` change its status, which is exactly PRD §12/§13's Start/Complete authorization.
- `request_status_history` + `recordAudit` — the audit trail PRD §28 asks for, already written by
  every mutation in `requests.service.ts`.
- `packages/ui` primitives (`Card`, `Button`, `StatusBadge`, `Modal`, `Select`, `Textarea`,
  `KpiCard`, `FormField`) and `apps/super-admin`'s PWA setup (`next-pwa`, `manifest.ts`,
  `InstallPrompt`) as a porting template.

So, like the Department Manager module before it, the ground truth is already correct and shared.
What's missing is a **self-service accept path**, **one real access-control gap** (§4 below), and a
**role-aware, mobile-first UI surface** that doesn't exist for this role yet. No new app, no new
login, no database migration.

## 3. Current architecture (as it affects this role today)

| Concern | Current behavior for `roleName === 'Department Staff'` |
|---|---|
| Login | Works today — same `CredentialsProvider`, same session shape, no changes needed. |
| Landing page | `postLoginPath()` (`lib/permissions.ts`) has no branch for this role → falls through to `/hotel/dashboard`, the hotel-wide GM dashboard. |
| Sidebar | `sidebar.tsx` only branches on `roleName === 'Department Manager'`; Department Staff gets `FULL_NAV_ITEMS` — the entire Hotel Admin/GM nav tree (Onboarding, Hotel config, People, Subscription, Settings…), all of which 403 at the service layer if actually used, since `hotel_admin`-only screens aren't in this role's `role_permissions`. Confusing, and a direct violation of PRD Rule 6/§7 ("keep the Staff UI simple", no access to configuration screens) even though nothing is technically breachable. |
| Mobile nav | **Does not exist.** `Sidebar` is `hidden md:flex` — on a phone, every hotel-admin user today (including Department Staff) has no navigation at all below the `md` breakpoint apart from the topbar. PRD §20 requires a mobile-first UI with a bottom tab bar; nothing like it exists in this app yet, for any role. |
| Request visibility (`GET /api/v1/hotel/requests`) | **Security gap.** `listRequests`'s `resolveRequestScope` only restricts `roleName === 'Department Manager'`. Department Staff has a hotel-wide `view` grant on `hotel_requests` (`hotel-roles.service.ts`) and nothing narrows it by department — a Department Staff session can list or filter **every department's requests, hotel-wide**, directly violating PRD Rule 3. This is the exact class of bug `department-manager-plan.md` Phase A already fixed for the Manager role; it was never extended to Staff. |
| Accepting a task | **Missing entirely.** The only assignment path is `assignRequest` (`POST /api/v1/hotel/requests/[id]/assign`), gated by `assertCanManageRequest` — `hotel_admin`, Reception, or the department's own manager only. A Department Staff caller fails that check and gets a 403. There is no self-service "claim this unassigned request" action anywhere in the app today, so PRD §11 ("Accept Task") cannot currently be performed by a staff member at all. |
| Start / Complete | Already works correctly once a request is `assigned_to` the caller — `assertCanWorkRequest` permits it, `REQUEST_TRANSITIONS` enforces `assigned → in_progress → completed` and rejects skipping straight to `completed`. No changes needed here beyond exposing it through Staff-appropriate UI. |
| Notes | `addRequestNote` already works for a staff member's own assigned request (same `assertCanWorkRequest` gate); nothing to change. |
| Notifications | `notifications/page.tsx` already branches per-role (`getDepartmentAlerts` for Department Manager, hotel-wide `getHotelAlerts` otherwise) — Department Staff currently falls into the hotel-wide branch, another Rule 3 leak. |
| Profile | No self-service "my profile" page exists for any hotel_staff role today — the topbar shows name + role only. |
| PWA | Not configured at all for `apps/hotel-admin` (super-admin has `next-pwa` + `manifest.ts` + `InstallPrompt`; hotel-admin has neither). |

## 4. Contradictions found → resolutions (same format as `schema-changes.md`)

| PRD requirement | Existing state | Resolution |
|---|---|---|
| Rule 3: staff sees only requests in their assigned department(s) | `listRequests` only scopes Department Manager, not Department Staff (§3 above) | Extend `resolveRequestScope` to also restrict `roleName === 'Department Staff'`, deriving the allowed department set from `user_departments` (not `departments.manager_id` — staff have no managed departments) via a new `getStaffDepartmentIds(hotelId, userId)`. Visibility stays **department-wide** (not "only requests assigned to me") — PRD §6's worked example ("Selecting Housekeeping shows only Housekeeping tasks", plural, from potentially several staff) and §7's "Task List" filters (`All/New/Assigned/In Progress/Completed`) both imply seeing the department's queue, not just one's own claimed items; write access to any individual request stays gated by `assertCanWorkRequest` (assigned-to-self) regardless of what's visible. |
| §11 "Accept Task" | No self-assign path exists (§3 above) | New `acceptRequest(hotelId, requestId, actor)` in `requests.service.ts`: verifies the request is `pending`, verifies `department_id` is in the actor's `user_departments`, verifies the actor's own `users.status === 'active'` (re-read from DB, not the 8h-old session — see §7), then does a **conditional** update (`updateMany` with `status: 'pending'` still in the `where`) so two staff racing to accept the same request can't both succeed — the loser gets a "someone already claimed this" error, not a silently overwritten assignment. Writes `request_status_history` (`to_assignee`, `from_status: pending`, `to_status: assigned`) and an audit row (`request.accepted`), exactly like every other mutation in this file. |
| §19 "An inactive staff member must not receive new tasks" | Login already blocks `status !== 'active'`, but a session lives 8h — a GM deactivating someone mid-shift doesn't invalidate their existing JWT | `acceptRequest` re-checks `users.status` fresh from the DB (not the session) before letting a claim succeed. `assignRequest` (used by managers/Reception to hand work to someone) gets the same check added to the assignee lookup, since "inactive staff must not receive new tasks" applies regardless of who initiates the assignment — this is a one-line tightening of an existing, shared function; see §8 for why it's safe. |
| §3/§5/§20 mobile-first dashboard, task list, bottom nav | No mobile nav exists in the app at all (§3 above) | New `StaffBottomNav` client component (`md:hidden`, mirrors `Sidebar`'s `useSession()`-branching pattern), new simplified desktop `STAFF_NAV_ITEMS` for `Sidebar` (mirrors the existing `MANAGER_NAV_ITEMS` branch) — both scoped to `roleName === 'Department Staff'` only, every other role's nav is untouched. |
| §9/§18 Profile screen | Doesn't exist for any staff role yet | New read-only `/hotel/staff/profile` page: name, employee ID, mobile, email, assigned departments, account status — all already-stored fields (`users.employee_id` from the Hotel Admin module's schema-changes.md, `user_departments`, `users.status`). No new columns. |
| §21 PWA | Not configured for `apps/hotel-admin` | Port `next-pwa` config, `manifest.ts`, and `InstallPrompt` from `apps/super-admin` verbatim (same "internal app shell only, `NetworkOnly` on `/api/*`" caching policy — this app also carries sensitive guest/staff data, same reasoning applies). Benefits the whole app, not just Staff, consistent with "one architecture" — but no other role's behavior changes as a result. |
| §17 Notifications | No push/SMS/email infra exists anywhere in RoomLink (confirmed — no `notifications` table, no subscription/device-token model, no queue) | Same decision `department-manager-plan.md` §5 already made explicitly for this app: **in-app only**, via the existing computed-alert pattern (`alerts.service.ts`). New `getStaffAlerts(hotelId, departmentIds)` (department-scoped, reusing `getDepartmentAlerts`'s shape but pointing `href` at `/hotel/staff/tasks` instead of `/hotel/manager/queue`). Push notifications stay an explicit, logged non-goal for V1, not a silent omission. |

**No `packages/db` schema changes are needed for any of the above** — same conclusion the
Department Manager module reached, for the same reason: every gap closes with new service
functions over existing tables/columns, or UI-only work.

## 5. Required API changes

New:

- `POST /api/v1/hotel/requests/[requestId]/accept` — calls new `acceptRequest`. Empty body. Same
  `requireHotelSession` → `requireCanHotel(user, 'hotel_requests', 'edit')` → service-layer check
  pattern as every other mutation in this route family.
- `GET /api/v1/hotel/requests/[requestId]` — single-request fetch (scoped through the same
  `resolveRequestScope`), needed so the Task Detail page and its action buttons can re-fetch state
  after Accept/Start/Complete without a full page reload. Doesn't exist today — every current page
  gets requests via `listRequests`/`getManagerQueueRequests` only.

Reused as-is (no changes): `GET /api/v1/hotel/requests` (service-layer scope fix, route unchanged),
`POST /api/v1/hotel/requests/[requestId]/status`, `POST /api/v1/hotel/requests/[requestId]/note`,
`GET /api/v1/hotel/requests/[requestId]/history`.

New service functions (`requests.service.ts` unless noted):

- `getStaffDepartmentIds(hotelId, userId)` — `user_departments` lookup, mirrors
  `getManagerDepartmentIds`'s shape but a different source table.
- `resolveRequestScope` extended with a `Department Staff` branch (see §4).
- `acceptRequest(hotelId, requestId, actor)` (see §4).
- `getStaffTaskSummary(hotelId, userId, departmentIds)` — the Home dashboard's three tallies:
  `newAvailable` (pending, unassigned, in the caller's departments), `myActive` (`assigned_to` the
  caller, status in `assigned`/`in_progress`), `completedToday` (`assigned_to` the caller,
  `completed_at` today). Same computed-count pattern as `getManagerQueueKpis`.
- `getRequestById(hotelId, requestId, actor)` — single-request read, running the same
  `resolveRequestScope` check as `listRequests` so a Task Detail deep-link can't bypass department
  isolation.
- `alerts.service.ts`: `getStaffAlerts(hotelId, departmentIds)` (see §4 table).

## 6. Required pages (all new, under `apps/hotel-admin/src/app/hotel/staff/`)

| Route | Purpose | PRD § |
|---|---|---|
| `/hotel/staff/home` | Dashboard: NEW/IN PROGRESS/COMPLETED tallies, department chip filter, a short list of top tasks (reuses the Task Card component, not the full list) | §5, §6 |
| `/hotel/staff/tasks` | Full task list: status filter (All/New/Assigned/In Progress/Completed), department chip filter (own departments only), priority filter, optional room filter | §7 |
| `/hotel/staff/tasks/[requestId]` | Task detail: room, request, guest name only (no phone/email —§15 data minimization), department, priority, created time, assignee, status, notes; Accept/Start/Complete action depending on state and ownership; add-note form | §9, §15, §16 |
| `/hotel/staff/profile` | Read-only profile fields (§4 table) | §18 |

`postLoginPath()` gets a `'Department Staff' → '/hotel/staff/home'` branch, same mechanism as the
existing Manager branch. `/hotel/notifications` (existing route) gets a third branch for this role
calling `getStaffAlerts`, alongside its existing Manager/default branches.

## 7. Required components

- `StaffTaskCard` — the mobile card from PRD §8 (room, title, department badge, priority badge,
  elapsed time, primary action button). New, not a reuse of `RequestsBoard`'s table layout — PRD
  §20 explicitly says avoid tables on mobile, and `RequestsBoard` is a `<table>` built for
  desktop GM/Reception/Manager use. Shared between the Home page's "top tasks" list and the full
  Tasks list page.
- `StaffBottomNav` — fixed `md:hidden` bottom bar (Home / Tasks / Notifications / Profile),
  active-route highlighting, `'use client'` + `useSession()` exactly like `Sidebar` today, renders
  nothing unless `roleName === 'Department Staff'`.
- `Sidebar` gets a third branch (`STAFF_NAV_ITEMS`, desktop-only, same four items) alongside the
  existing `FULL_NAV_ITEMS`/`MANAGER_NAV_ITEMS`.
- `hotel/layout.tsx` gets one addition — `<StaffBottomNav />` after `<main>` — plus bottom padding
  on `<main>` so content doesn't sit under the fixed bar on mobile. This is the one genuinely shared
  file this module touches; per PRD §30/`architecture.md`'s existing convention, it's an additive,
  role-gated change that renders as `null` for every other role, same pattern the Manager module
  already established for `Sidebar`.

## 8. Security considerations

1. **Department isolation is the load-bearing fix.** Without the `resolveRequestScope` extension
   (§4), everything else in this plan sits on top of a hotel-wide data leak — a Department Staff
   session could already list every request in the hotel today. This is fixed first, same ordering
   `department-manager-plan.md` used ("Phase A — do first; it's a real access-control gap").
2. **Every id a client supplies is still proven to belong to the caller's hotel/department before
   use** — `acceptRequest` re-derives the request's `hotel_id`/`department_id` from the DB via
   `findFirstOrThrow({ where: { request_id, hotel_id } })`, never trusts a client-asserted
   department. Matches the existing "Cross-tenant FK validation" convention (`schema-changes.md`).
3. **Race-safety on Accept**: the conditional `updateMany` (§4) closes a real concurrency bug that
   would otherwise exist the moment two staff members can see the same unassigned request — a
   plausible, likely scenario for this exact role (multiple Housekeeping staff, one pending towel
   request).
4. **Tightening `assignRequest`'s inactive-staff check** touches a function also used by Reception,
   Hotel Admin, and Department Manager. It's additive and stricter, not looser: today it's silently
   possible to assign a request to a disabled staff account (a latent bug, not a feature anyone
   relies on), so no legitimate existing flow narrows. A Vitest case is added asserting the
   pre-existing manager/Reception/Hotel Admin assignment flows still succeed for active assignees
   (§9), specifically to catch any regression before this ships.
5. **Data minimization (Rule 15)**: the existing `REQUEST_INCLUDE` in `requests.service.ts` already
   selects only `guests.full_name` — no phone/email leak to fix; the new Staff pages simply must not
   introduce a new query that selects more than that.
6. **Backend-only enforcement, no frontend-trust**: every new page reads data via
   `requireHotelPageSession()` + the scoped service functions server-side (same as every existing
   `app/hotel/**/page.tsx`); every new mutation goes through
   `requireHotelSession` → `requireCanHotel` → service-layer checks, matching the three-layer model
   `navigation-and-permissions.md` documents. No authorization decision is made only in a React
   component.
7. **`roleId`/`hotelId`/`staff_id` never trusted from the client** — `acceptRequest`,
   `getRequestById`, and the department-scope check all derive identity from `HotelSessionUser`
   (session-sourced), never from a request body/query param, matching this app's existing pattern.

## 9. Test plan

This codebase's actual, established testing convention (checked before writing this section, not
assumed) is: pure-function Vitest coverage for anything logic-only (`transitions.test.ts`,
`sla.test.ts` — no test anywhere in either app hits Prisma/a real DB), plus **live HTTP verification
against the seeded pilot hotels** for anything data/security-related — exactly what
`department-manager-plan.md` §8 did for the Manager module's Phase A isolation fix. This module
follows the same split rather than introducing a new DB-integration-test pattern the codebase
doesn't otherwise use:

- **Vitest** (`transitions.test.ts`, unchanged): still covers every status transition Accept/Start/
  Complete relies on (`assigned → in_progress → completed` allowed, `pending → completed` and other
  skips rejected). No new pure-logic surface was added that isn't already covered by it or
  `sla.test.ts` — `acceptRequest`'s and `resolveRequestScope`'s logic is inherently DB-shaped
  (Prisma queries, a transaction), so it's exercised by live verification instead, below.
- **Live verification, real NextAuth login, no bypass** — see §12 for the actual run and results:
  department isolation, hotel isolation, multi-department staff, accept/start/complete, race-safety
  on accept, the inactive-staff gate (on both `acceptRequest` and `assignRequest`), and regression
  checks on Hotel Admin and Department Manager.

## 10. Build phases (PRD §31's recommended order, adapted to this codebase)

All phases complete — see §12 for verification detail.

1. [x] **Department isolation fix + inactive-staff tightening** (§4, §8) — security first, same
   ordering precedent as the Manager module. Also hardened `getRequestHistory`, found to have the
   same latent gap during implementation (see §12's note).
2. [x] `postLoginPath` branch, `getStaffDepartmentIds`, `getStaffTaskSummary`.
3. [x] `acceptRequest` service function + `POST .../accept` route.
4. [x] `getRequestById` + `GET /api/v1/hotel/requests/[requestId]` route.
5. [x] `StaffTaskList` (card-based, not `RequestsBoard`'s table), `/hotel/staff/tasks` (list +
   filters), `/hotel/staff/tasks/[requestId]` (detail + Accept/Start/Complete/note actions).
6. [x] `/hotel/staff/home` dashboard.
7. [x] `Sidebar` `STAFF_NAV_ITEMS` branch, `StaffBottomNav`, `hotel/layout.tsx` wiring.
8. [x] `getStaffAlerts` + `/hotel/notifications` third branch.
9. [x] `/hotel/staff/profile`.
10. [x] PWA: ported `next-pwa` config, `manifest.ts`, `InstallPrompt` into `apps/hotel-admin` (it had
    none before this module — only `apps/super-admin` did).
11. [x] `tsc --noEmit`, `vitest run` (9/9, unchanged), `next lint`, `next build` (all clean — see §12).
12. [x] Live verification against `PILOT-15`/`PILOT-110` (§12) + regression pass on Hotel Admin and
    Department Manager.
13. [x] This document updated in place (§12); `docs/hotel-admin/navigation-and-permissions.md` and
    `architecture.md` updated to document the new role branch (see those files' own diffs).

## 12. Verification (2026-08-16)

`tsc --noEmit`, `next lint`, and `next build` (68 routes, including the 4 new Staff pages and 2 new
API routes) all clean. `vitest run`: 9/9 passing, unchanged (no new pure-logic surface — see §9 for
why).

Then live, against the real HTTP API through the actual NextAuth credentials flow (cookie-based
login, not a bypass), against the already-seeded `PILOT-15`/`PILOT-110` hotels — Raju
(`raju@pilot15.example`, Housekeeping + Restaurant + Maintenance, PRD §25's exact worked example)
and Sita (`sita.hk@pilot110.example`, Housekeeping, PRD §26). Both accounts' passwords were reset to
the same known test password the seed script already uses for the Hotel Admin accounts
(`TestPass123!`), same precedent `department-manager-plan.md` §8 set for Anita.

- **Department isolation.** Logged in as Raju. `GET /api/v1/hotel/requests` with no filter returned
  only his three departments' rows (Housekeeping/Restaurant/Maintenance) — no Reception rows, even
  though Reception exists in his hotel and he has a hotel-wide `view` grant on the module. Filtering
  explicitly by Reception's `department_id` (his own hotel, a department he's *not* in) → `403`.
  Filtering by PILOT-110's Housekeeping `department_id` (cross-tenant) → also `403`.
- **Hotel isolation.** As Raju: fetching a PILOT-110 request by id directly (`GET
  /api/v1/hotel/requests/{id}`), its history, and attempting to `accept` it all returned `404` —
  indistinguishable from "doesn't exist," consistent with every other cross-tenant check in this
  app.
- **The 15-room scenario, PRD §25, all three department types, one staff member:** Raju accepted an
  Extra Towels request (Housekeeping), a Chicken Biryani order (Restaurant), and an AC-not-cooling
  report (Maintenance) — full Accept → Start → Complete cycle run end-to-end on the Housekeeping one,
  Accept → Start → Complete on the Restaurant one, Accept-only left on the Maintenance one (used
  below for the inactive-staff check). Attempting to jump `assigned → completed` directly (skipping
  Start) on the Restaurant request → `403`, confirming `REQUEST_TRANSITIONS` still gates the Staff
  call sites correctly.
- **Race-safety on Accept.** Re-accepting the already-claimed Extra Towels request → `409`
  ("already been claimed or is no longer available to accept") — the conditional `updateMany` closes
  the race window as designed.
- **Inactive staff, both directions.** Deactivated Raju mid-session (`users.status = 'disabled'`,
  simulating a GM action while his 8h JWT is still valid) → his next `accept` call on the Maintenance
  request returned `403`, not a silent success — confirms the fresh DB re-read, not the stale
  session, gates this. Reactivated him and confirmed the request was still legitimately claimable
  state afterward. Separately, as Anita (PILOT-110's Department Manager): assigning a fresh
  Housekeeping request to Sita while she was active → `200`; deactivating Sita and retrying the exact
  same assignment → `403` — confirms the `assignRequest` tightening (§4/§8.4) without breaking the
  manager's normal flow.
- **Regression, Hotel Admin.** Logged in as Suresh (PILOT-15's Hotel Admin) — `GET
  /api/v1/hotel/requests` still returns hotel-wide rows across all three departments, unaffected by
  the Staff-only branch added to `resolveRequestScope`.
- **Regression, Department Manager.** Logged in as Anita — `/hotel/manager/queue` still renders;
  `GET /api/v1/hotel/requests` still returns exactly her one managed department's rows, unaffected by
  the same change.
- **New pages render** for Raju: `/hotel/staff/home` (200, tallies + task cards), `/hotel/staff/tasks`
  (200), `/hotel/staff/profile` (200, showing his three department badges and employee fields),
  `/hotel/notifications` (200, department-scoped). Root `/` redirects a Department Staff session to
  `/hotel/staff/home` via the new `postLoginPath` branch.
- **One gap found and fixed during implementation, not during planning**: `getRequestHistory` had no
  department-isolation check at all (any hotel-scoped caller could read any request's timeline by
  guessing/knowing a `requestId`) — a latent version of the same class of bug this module fixes for
  `listRequests`, pre-dating this module (the Manager module's History modal already used it
  unscoped). Fixed alongside the Staff scope fix, in the same function, since it's the same isolation
  boundary Rule 3 already required; verified via the hotel-isolation check above (history 404s
  cross-tenant).

Not independently re-verified this session (unchanged by this module, and already verified in
`department-manager-plan.md` §8): Super Admin's own portal, and Hotel Admin/GM's non-request screens
(profile, rooms, QR codes, menu, subscription, settings).

## 11. Explicitly out of scope (matching this app's existing documented decisions)

- Push/SMS/email notifications — in-app only (§4 table; same non-goal `department-manager-plan.md`
  §5 already logged).
- Guest-facing conversation UI — no guest-facing surface exists anywhere in this app yet
  (`architecture.md`'s "Guest-facing scope" decision); a Staff member's "see relevant conversation"
  capability (PRD §16) stays unimplemented until that surface exists, same as Reception and
  Department Manager today.
- Staff-initiated reassignment (PRD §14 explicitly forbids it) — no reassignment UI/API is added for
  this role; `[Request Reassignment]`-style escalation is already covered by the existing
  `addRequestNote`/note-to-manager path, not a new administrative capability.
- Shift/availability scheduling beyond `users.status` (PRD §19 explicitly scopes V1 to
  ACTIVE/INACTIVE only).
