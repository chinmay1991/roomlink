# Department Manager — Implementation Plan

Status: **built and verified** (2026-08-16) against the seeded pilot hotels, per the PRD
(`docs/RoomLink_V1_Department_Manager_PRD.pdf`, V1.0 Pilot Release). See §8 for the verification run.

## 1. Objective

Give the optional "Department Manager" role (PRD §1) a focused, department-scoped experience: own their
department's request queue, assign/reassign eligible staff, track work through its lifecycle, and
escalate — without hotel-wide configuration authority. When no manager exists, Reception and the Hotel
Admin/GM must keep working exactly as they do today (PRD §16, "no separate product path").

## 2. Decision: extend `apps/hotel-admin`, not a new app

`apps/hotel-admin` already has:
- A `hotel_staff` login that issues sessions carrying `{ id, userType, roleId, hotelId }`.
- A real "Department Manager" role: `departments.service.ts`'s `setDepartmentManager` auto-promotes a
  user's `role_id` to "Department Manager" when assigned, and auto-demotes them back to "Department
  Staff" when they no longer manage anything (`demoteIfNoLongerManaging`).
- Data-scoping primitives already written for this exact role: `requests.service.ts`'s
  `assertCanManageRequest` (assign/reassign/escalate — checks `departments.manager_id === actor.id`) and
  `assertCanWorkRequest` (status transitions).
- `listEligibleAssignees(hotelId, departmentId)` — the department-membership eligibility check PRD §5
  asks for, including multi-department staff.
- `HOTEL_MODULES` grants already seeded for "Department Manager" in `hotel-roles.service.ts` (view on
  dashboard/staff/notifications, view+edit on services/requests).

So the ground truth (`packages/db` schema, RBAC tables, auth) is already correct and shared with
Reception/Hotel Admin — exactly the "one architecture" principle PRD §16 asks for. What's missing is a
**role-aware UI surface** and **one backend scoping gap** (§3 below). No new app, no new login, no
database migration.

## 3. Gaps found (current app vs this PRD)

| PRD requirement | Current state | Resolution |
|---|---|---|
| §2/§13 "Department isolation": manager sees only their own department(s)' requests | **Security gap.** `GET /api/v1/hotel/requests` → `listRequests()` only filters by `departmentId` if the *client* passes one, and never checks it against the caller's role. A Department Manager's session can currently list or filter every department's requests hotel-wide. | `listRequests` takes the acting user; for role "Department Manager" it derives the allowed department id set from `departments.manager_id = actor.id` and always intersects with it — a client-supplied `departmentId` outside that set is rejected, not trusted. hotel_admin and Reception keep hotel-wide access (matches `navigation-and-permissions.md`, unchanged). |
| §3 "First screen after login is a focused department work queue, not a hotel-wide management dashboard" | `/hotel/dashboard` is one hotel-wide KPI dashboard, shown to everyone including Department Manager. | New department-scoped Queue page, only for this role; existing `/hotel/dashboard` untouched for hotel_admin/Reception. |
| §3 KPIs: new / unassigned / assigned / in progress / completed today / delayed-escalated | Not computed anywhere at department granularity. | New `getManagerQueueSummary()` in `requests.service.ts`, scoped to the manager's department id set, reusing the existing `staleCutoff`-style computed-alert pattern from `alerts.service.ts` (nothing stored, matches PRD's "don't overbuild notification infra"). |
| §3 "Team availability… eligible staff, active status, current workload" | `listEligibleAssignees` returns names only, no workload; there's no page that shows it. | Extend it to include each member's count of currently `assigned`/`in_progress` requests; new `/hotel/manager/team` page. |
| §4 sort by "oldest, newest, priority and SLA risk"; elapsed time | `requests-board.tsx` only filters by status/department; no sort, no elapsed-time column, no SLA-risk indicator. | Add sort control + elapsed-time column + an SLA-risk flag computed the same way `alerts.service.ts` already flags stale-unassigned work (priority-scaled threshold), not a new stored field. |
| §4 Task detail: room, service, guest-visible notes, status, priority, timestamps, assignee, **conversation**, **internal activity timeline** | `getRequestHistory()` exists in `requests.service.ts` and is fully correct, but **no page renders it** — there is no per-request detail view anywhere in `apps/hotel-admin` today. Guest conversation UI is confirmed out of scope for the whole app (`architecture.md`, "Guest-facing scope" decision — no guest-facing surface exists yet). | Add a request detail slide-over/modal that calls the existing history endpoint. Conversation thread stays out of scope, consistent with the app's existing documented decision — internal notes/timeline only. |
| §5 "keep unassigned with a clear reason/alert" | No such action exists; a request just sits `pending` with no record of *why*. | New `POST /api/v1/hotel/requests/{id}/note` (or reuse status-history) that writes a `request_status_history` row with `from_status = to_status = current`, `note = reason`, no schema change — reuses the existing history table exactly as designed. |
| §6 Escalation: "state the reason, urgency and recipient" | `escalateRequest` takes an optional free-text `note` only; the current UI button posts no note at all (`escalate()` sends `'{}'`). | Replace the one-click escalate button with a small form (urgency + recipient + reason) that composes a structured `note` string — no schema change, since `request_status_history.note` is free text and urgency/recipient are just UI-level structure, not something we need to filter/query on in V1. |
| §6/§11 "Confirm cancellations… capture reasons for auditable exceptions" | `updateRequestStatusSchema.note` is optional for every status, including `cancelled`; no confirm dialog. | UI requires a reason + confirm dialog specifically when target status is `cancelled`; service layer stays as-is (`note` already flows into history). |
| §10 Navigation: Dashboard/Queue, Requests, Team, Activity, Notifications, Profile only | `sidebar.tsx` is one static list (`Dashboard, Onboarding, Hotel, People, Guest Services, Operations, Subscription, Settings`) shown to every `user_type` regardless of role — a Department Manager currently sees the full Hotel Admin nav, including screens they have no grant for. | Sidebar becomes role-aware: reads `session.user.roleName` (new, see §4) and renders the PRD §10 nav for "Department Manager", the existing full nav for `hotel_admin`, and (out of scope for this change, but noted) Reception's own nav could use the same mechanism later. |
| §12 Activity: department operational activity, inspectable by Reception/GM | `listHotelActivity` returns **every** hotel audit-log row (GST changes, subscription, staff creation…) to anyone who can reach `/hotel/activity`. | New `listDepartmentActivity(hotelId, departmentIds)` — filters to `entity_type = 'request'` rows whose `entity_id` belongs to one of the manager's departments, reusing `audit_logs` (no schema change). Existing hotel-wide `listHotelActivity` stays as-is for hotel_admin. |
| §9 Notifications scoped to the manager's own department | `getHotelAlerts` is hotel-wide (unassigned/escalated across *all* departments, QR gaps, menu gaps — several of which a Department Manager has no authority over anyway). | New `getDepartmentAlerts(hotelId, departmentIds)` — same computed-alert pattern, filtered to the manager's departments and only the alert types relevant to them (unassigned, escalated, SLA risk); QR/menu alerts stay hotel_admin-only. |

**No `packages/db` schema changes are needed for any of the above** — every gap is closeable with new
service functions over existing tables/columns, or UI-only work. This keeps the change low-risk and
avoids a migration for a pilot-scoped feature.

One small addition for convenience, not correctness: `HotelSessionUser` (`require-hotel-session.ts`)
currently carries `roleId` but not the role's *name*, and every "is this a Department Manager" check
elsewhere does a `prisma.roles.findUnique` lookup (see `assertCanManageRequest`). The plan adds
`roleName` to the session/JWT at login (one extra field, same pattern as `hotelId`) so the sidebar and
new department-scoped services can branch on role without an extra query per request. This is additive
to the session shape only — no DB change.

## 4. What's explicitly reused, unchanged

- Auth/session: `auth.ts`, `require-hotel-session.ts`, `require-hotel-page-session.ts`.
- Manager assignment/demotion: `departments.service.ts` (`setDepartmentManager`, `demoteIfNoLongerManaging`).
- Assign/status/escalate mutations and their authorization checks: `assertCanManageRequest`,
  `assertCanWorkRequest`, `REQUEST_TRANSITIONS` in `transitions.ts`.
- `listEligibleAssignees` as the base for the new Team page (extended, not replaced).
- `packages/ui` components (`Card`, `Button`, `Select`, `StatusBadge`, `KpiCard`, `Modal`, `FormField`).
- Audit recording (`recordAudit`) and the `request_status_history` table.
- Reception's and Hotel Admin's existing screens — untouched.

## 5. Explicitly out of scope (PRD §15, and matching this app's existing documented decisions)

- Any hotel-wide configuration, user provisioning, rooms/QR setup, GST/legal, subscription admin.
- Guest-facing conversation UI — the whole app has no guest-facing surface yet (documented decision in
  `architecture.md`); a Department Manager's "communicate with the guest" capability (PRD §1/§9, "where
  permitted") stays unimplemented until that surface exists, same as it is for Reception today.
- Service-specific skill/certification matching (PRD §5 — explicit V1 non-goal).
- Push notifications / email/SMS — in-app only, matching the app's existing Phase 11 decision.
- Restaurant POS beyond the existing lightweight menu/order model.

## 6. Build phases

- [x] **Phase A — Department isolation fix (do first; it's a real access-control gap).**
      `requests.service.ts`: `listRequests` takes the acting `HotelSessionUser`, resolves the caller's
      allowed department-id set for the "Department Manager" role, and enforces it server-side
      regardless of client-supplied filters. `GET /api/v1/hotel/requests/route.ts` passes `user` through.
      Add a Vitest case (alongside `transitions.test.ts`'s pattern) proving a manager's request for a
      foreign department returns empty/403, not another department's rows.

- [x] **Phase B — Session role name.** Added `roleName` to the NextAuth JWT/session (`auth.ts`,
      `types/next-auth.d.ts`), sourced once at login the same way `hotelId` is. `HotelSessionUser` in
      `require-hotel-session.ts` carries it too; `listRequests`'s scope check reads it directly instead
      of doing its own `roles` lookup.

- [x] **Phase C — Backend: department-scoped queue, team, activity, alerts.**
      `requests.service.ts`: `getManagerDepartmentIds`, `getManagerQueueKpis`, `getManagerQueueRequests`,
      `addRequestNote` (also covers "keep unassigned with a reason").
      `departments.service.ts`: `getManagerTeam(hotelId, departmentIds)` (extends `listEligibleAssignees`
      with per-member active workload).
      `activity.service.ts`: `listDepartmentActivity(hotelId, departmentIds)`.
      `alerts.service.ts`: `getDepartmentAlerts(hotelId, departmentIds)`.
      `server/sla.ts` (+ `sla.test.ts`): the SLA-risk heuristic, pure/tested like `transitions.ts`.
      `request.schema.ts`: `updateRequestStatusSchema` now `.superRefine`s a required `note` when
      `status === 'cancelled'`; `escalateRequestSchema` takes `{ urgency, recipient, reason }`, folded
      into the stored history `note` by `escalateRequest` — no schema/DB migration, per §7.
      New API routes: `requests/[requestId]/note`, `requests/[requestId]/history` (the service function
      already existed but nothing had exposed it).

- [x] **Phase D — Frontend: role-aware navigation.**
      `sidebar.tsx` branches on `session.user.roleName` (via `useSession()`, same pattern as `topbar.tsx`):
      "Department Manager" gets PRD §10's five reachable items (Dashboard/Queue, Requests, Team, Activity,
      Notifications — "Profile" stays topbar-only, see the code comment for why); everyone else keeps
      today's nav unchanged.

- [x] **Phase E — Frontend: new pages.**
      `app/hotel/manager/queue/page.tsx`, `.../team/page.tsx`, `.../activity/page.tsx` built.
      `app/hotel/requests/requests-board.tsx` extended in place (shared by Reception, Hotel Admin, and
      the new Queue page) with: sort control (SLA risk / priority / oldest / newest), an elapsed-time +
      SLA-risk column, a Cancel action (modal, reason required), a real Escalate form (urgency/recipient/
      reason), a Note action (covers §5's "keep unassigned + reason" and §9's general coordination notes),
      a History modal rendering the full timeline, and a `canCreateRequests` prop (`false` on the manager
      Queue page — Department Manager has no `create` grant on `hotel_requests` per `hotel-roles.service.ts`,
      so the create-request form is hidden rather than shown-then-403).
      `app/hotel/notifications/page.tsx` branches to `getDepartmentAlerts` for this role.

- [x] **Phase F — Verification.** See §8 — run live against the seeded `PILOT-110`/`PILOT-15` hotels
      through the real HTTP API (NextAuth credentials login, not a bypass), not just `next build`.

## 7. Decisions (confirmed)

1. **Cancel-reason enforcement**: server-side required. `updateRequestStatusSchema` rejects an empty
   `note` when `status === 'cancelled'` (Zod `.superRefine`), not just a client-side UI nudge.
2. **Escalation urgency/recipient**: folded into the existing `request_status_history.note` field as a
   structured string composed by the UI form — no schema change.
3. **Landing page**: the new Queue page gets its own route, `/hotel/manager/queue`. No redirect logic in
   `middleware.ts`; the role-aware sidebar (Phase D) just points "Dashboard" there for this role.

## 8. Verification (2026-08-16)

`tsc --noEmit`, `vitest run` (9/9, including new `sla.test.ts`), `next lint`, and `next build` (59
routes, including the 3 new manager pages and 2 new API routes) all clean.

Then run live against the already-seeded `PILOT-110`/`PILOT-15` hotels (`build-phases.md` Phase 13),
through the real NextAuth credentials flow (cookie-based login), not a bypass:

- **Department isolation (the Phase A fix).** Logged in as Anita (Housekeeping Manager, `PILOT-110`).
  `GET /api/v1/hotel/requests` with no filter returned Housekeeping-only rows. Filtering explicitly by
  Maintenance's `department_id` (a *different* department in her *own* hotel) → `403 Forbidden`.
  Filtering by `PILOT-15`'s Housekeeping `department_id` (cross-tenant) → also `403`, confirming the
  fix rejects both a foreign-department id and a foreign-hotel id, not just one or the other.
- **Create-permission boundary.** Anita `POST`ing a new request directly → `403` (Department Manager
  has no `create` grant on `hotel_requests`), confirming the Queue page is right to hide that form.
- **Full request lifecycle as the manager**, on a fresh request created by the hotel_admin (Priya) and
  routed to Housekeeping: added an "unassigned, no staff free yet" note while still pending → assigned
  to Sita → started → escalated with `{urgency: urgent, recipient: gm, reason: "..."}`  → cancel
  rejected with `400` and a field-level Zod error when no reason was supplied → cancel succeeded once a
  reason was given. `GET .../history` showed the complete timeline in order, each row correctly
  attributed to Priya or Anita, with the escalation's urgency/recipient/reason visible in its `note`.
- **New pages render correctly** for Anita: Queue (KPI row, team availability, work queue), Team
  (member list with department badges + workload), Activity (department-scoped `request.*` audit
  entries only — no GST/staff/subscription noise), Notifications (department-scoped alerts).
- **PILOT-15 (no managers) unaffected**: logged in as Suresh (Hotel Admin), `GET /api/v1/hotel/requests`
  still returns hotel-wide rows including Raju's existing multi-department request — proves the
  Department Manager-only restriction in Phase A doesn't touch Reception/Hotel Admin/Department Staff
  behavior, and the role stays optional exactly as PRD §16 requires.

One incident during verification, unrelated to the code changes: an already-running dev server on port
3001 (not started by this session) was serving stale build output after an unrelated `next build` ran
underneath it and got 500s; it was restarted cleanly as part of verification. No data other than this
session's own test requests (and one pilot account's password, reset to the same known test password
the seed script already uses elsewhere, to be able to log in as it) was touched.
