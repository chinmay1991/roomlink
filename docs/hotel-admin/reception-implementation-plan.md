# Reception — Implementation Plan

Status: **built and verified** (2026-08-16). See §L for the verification run. Written against the PRD
(`docs/RoomLink_V1_Hotel_Reception_PRD.pdf`, V1.0) after inspecting the already-built Super Admin,
Hotel Admin/GM, Department Manager, and Department Staff modules, per the PRD's own §42 process.
Built as part of `apps/hotel-admin` (per direct instruction — Reception is an operational hotel-wide
role like Department Manager, not a separate audience/deployable like Guest), alongside the Guest
module (`docs/guest/guest-implementation-plan.md`) so the guest↔Reception conversation round trip
(Guest PRD §28) is verifiable end-to-end as both land.

## A. Current architecture — the load-bearing finding

**Reception's authorization model already exists and is already mostly correct.** Unlike Department
Staff (which needed a real security fix before anything else), Reception's backend was built
correctly from the start, because the Hotel Admin/GM module's own request-engine design already
special-cased Reception as a hotel-wide operational role:

| PRD requirement | Current state |
|---|---|
| §4 Reception role, backend-enforced | `HOTEL_STAFF_ROLE_NAMES` already includes `'Reception'`; login, session (`{ id, userType, roleId, roleName, hotelId }`), and `requireHotelSession` all already work for it — zero auth changes needed. |
| §3 Hotel-wide visibility of requests/departments/rooms/staff | `resolveRequestScope` (`requests.service.ts`) only *restricts* `Department Manager` and `Department Staff` — Reception falls through to the unrestricted, hotel-wide branch, already correct. `hotel-roles.service.ts`'s seeded grants already give Reception `view` on `hotel_departments`, `hotel_rooms`, `hotel_staff`. |
| §10/§14/§15 assign / reassign / escalate, hotel-wide | **Already fully functional.** `assertCanManageRequest` (`requests.service.ts`) has an explicit `if (role?.name === 'Reception') return` — Reception can already assign/reassign/escalate *any* request in the hotel via the existing `POST /api/v1/hotel/requests/[id]/assign` and `/escalate` routes and the shared `RequestsBoard` component. This is the same capability Hotel Admin has for requests, already granted to Reception, already tested (implicitly, via the Manager module's own use of the same functions). |
| §11 eligibility scoped to department + hotel + active status | `assignRequest` already validates the assignee belongs to the hotel, belongs to the request's department (`user_departments`), and (as of the Staff module) is `active` — Reception gets this for free, no new code. |
| §12/§13 routing works whether or not a Department Manager exists | Already true by construction — `assignRequest`/`resolveRequestScope` never assume a manager exists; a request with no manager just has a larger pool of eligible assignees. Verified live during the Staff module's testing (`PILOT-15`, no managers). |
| §16 SLA/elapsed-time indicator | `server/sla.ts` (`isAtSlaRisk`, `SLA_RISK_MINUTES`) already exists — built for the Manager module, directly reusable, no "SLA config" system exists to prefer over it (matches PRD §16's own fallback instruction). |
| §2/§29 must NOT see Hotel Settings, Staff Management, Department Config, Subscription, QR generation | Reception's `role_permissions` grants already correctly *exclude* `hotel_profile`/`hotel_qr_codes`/`hotel_menu`/`hotel_settings`/`hotel_managers` — the backend already 403s these. **What's missing is the nav** — `Sidebar` today shows Reception the same `FULL_NAV_ITEMS` as Hotel Admin (it only branches for `Department Manager`/`Department Staff`), so a Reception user currently sees links to screens they can't use. UI-only gap, not a security gap. |
| §20 active guest session visibility per room | `guest_sessions` table + `listGuestSessions` (`guest-sessions.service.ts`) already exist, built for Reception's own "check-in" action — just needs a room-joined view. |
| §17/§24 conversations, restaurant orders | **Missing entirely** — see §E. |

**Reused as-is, no changes**: `requireHotelSession`/`requireHotelPageSession`, `hotel-rbac.ts`,
`assertCanManageRequest`/`assertCanWorkRequest`, `REQUEST_TRANSITIONS`, `sla.ts`, `RequestsBoard`
(extended, not replaced — see §G), `listRooms`, `listStaff`, `listGuestSessions`, `recordAudit`,
`packages/ui`.

## B. Existing reusable components

- `packages/ui` (`Card`, `Button`, `Modal`, `Select`, `Textarea`, `StatusBadge`, `KpiCard`,
  `FormField`, `Pagination`, format helpers) — same kit every other screen in this app uses.
- `RequestsBoard` (`app/hotel/requests/requests-board.tsx`) — already shared by Hotel Admin,
  Reception (today, incidentally, since Reception has the grants), and the Manager Queue page. This
  becomes Reception's own Request Queue too (§G), extended with a Guest column + search + quick
  filters PRD §6/§7 ask for.
- `KpiCard` row pattern (`getManagerQueueKpis` → `ManagerQueuePage`) — the exact shape Reception's
  Dashboard needs, just hotel-wide instead of department-scoped.
- `getManagerTeam`'s per-member `activeWorkload` calculation (`departments.service.ts`) — the same
  shape PRD §23's Staff Status screen needs, hotel-wide instead of department-scoped.

## C. Existing APIs directly reusable, unchanged

`GET/POST /api/v1/hotel/requests`, `POST .../assign`, `POST .../status`, `POST .../escalate`,
`POST .../note`, `GET .../history`, `GET /api/v1/hotel/departments`, `GET /api/v1/hotel/rooms`,
`GET /api/v1/hotel/staff`, `GET /api/v1/hotel/guest-sessions`. All already authorize Reception
correctly; none need modification for this module.

## D. Existing database entities (no migration needed for Reception itself)

`requests`, `request_status_history`, `departments`, `user_departments`, `users`, `rooms`,
`guest_sessions`, `guests`, `orders`/`order_items`, `services`, `audit_logs` — all already exist and
already carry everything Reception's screens read. The one schema change this pairing of modules
needed (`guest_session_id` on `requests`/`orders`/`conversations`, `actor_type` gaining `guest`) was
already applied for the Guest module (`docs/guest/guest-implementation-plan.md` §5) — Reception
doesn't need anything beyond that, and in particular benefits from `guest_session_id` for showing
"which stay does this request/order belong to" precisely rather than by a room/time heuristic.

## E. Missing functionality (what this module actually builds)

1. **Conversations — genuinely new, both sides.** `conversations`/`messages` exist in the schema
   (`sender_type` already includes `guest`, built for exactly this) but zero code anywhere reads or
   writes them. New `conversations.service.ts`: `listConversations(hotelId)`,
   `getConversation(hotelId, id)`, `replyToConversation(hotelId, id, body, actor)` — Reception's
   reply is a `messages` row with `sender_type: 'staff', sender_id: actor.id`. Guest-side creation
   is the Guest module's responsibility (`docs/guest/guest-implementation-plan.md` §6);
   Reception's `getConversation` is what makes the Guest module's send actually reach someone.
2. **Restaurant order visibility — new, read-only.** New `orders.service.ts`: `listHotelOrders`,
   `getOrder`. PRD §24 is explicit Reception only *monitors*, never manages POS — no status-change
   capability is built here (that's a future Restaurant-staff module's job, same "not this module's
   responsibility" boundary the Guest module's plan already drew).
3. **Reception Dashboard — new.** Hotel-wide KPI row (new/unassigned/in-progress/escalated/
   high-priority/unread-messages/completed-today) — a new `getReceptionDashboard(hotelId)`,
   structurally identical to `getManagerQueueKpis` but without the `department_id IN (...)` scoping
   (Reception is hotel-wide by design).
4. **Room Overview — new.** Room number/type/occupancy/active session/open request count per room —
   `getReceptionRoomOverview(hotelId)`, joining `rooms` + `guest_sessions` (latest active) +
   `requests` (open count), extending `listRooms`'s existing query shape.
5. **Guest Lookup — new.** Search active guests by room/name/(mobile if permitted)/stay
   (`guest_session_id`)/request id — `searchGuests(hotelId, query)`, reading `guests` +
   `guest_sessions` + a request/conversation summary per hit.
6. **Department Monitoring + Staff Status — new, small.** Both are straightforward hotel-wide,
   read-only variants of logic that already exists department-scoped for the Manager module
   (`getManagerQueueKpis`, `getManagerTeam`) — new functions, same shape, no `department_id IN (...)`
   filter.
7. **Reception nav + landing page — new (UI only, the backend grant is already correct).**
   `RECEPTION_NAV_ITEMS` branch in `Sidebar`, `postLoginPath` branch to
   `/hotel/reception-desk/dashboard`.
8. **`RequestsBoard` extension — small, shared-component change.** Add a Guest name column (data
   already selected by `REQUEST_INCLUDE`, just not rendered) and a search box (room number / guest
   name / request id / request type, client-side filter over the already-fetched page — matches
   PRD §7's search fields without a new endpoint). Additive props with safe defaults, so Hotel
   Admin's and the Manager Queue page's existing usage is visually unaffected.
9. **Polling ("realtime")** — PRD §27 explicitly allows "minimum reliable polling" if no realtime
   infra exists (none does, anywhere in this codebase). Dashboard and Request Queue pages poll via a
   small client-side `setInterval` + `router.refresh()`, every 20s — no websockets/SSE, matching
   "do not introduce unnecessary infrastructure complexity."

## F. Required migrations

None beyond what's already applied for the Guest module (§D). Reception is pure read-surface + one
new write capability (conversation replies) over existing/already-migrated tables.

## G. Required screens (`apps/hotel-admin/src/app/hotel/reception-desk/`)

A new route namespace, not `/hotel/reception` (that path is already Hotel Admin's *Reception-staff-
account-management* screen — a different, admin-facing concern that must keep working unchanged).

| Route | Purpose |
|---|---|
| `/hotel/reception-desk/dashboard` | KPI row (§E.3) + department breakdown + polling. |
| `/hotel/requests` (existing, reused) | Request Queue — Reception's primary screen (PRD §6), already reachable and correctly permissioned; extended per §E.8. |
| `/hotel/reception-desk/conversations` | Conversation list (open/unread first). |
| `/hotel/reception-desk/conversations/[id]` | Thread + reply box + linked room/guest/requests, and a "Create Request" shortcut (PRD §18) pre-filling department/room from the conversation. |
| `/hotel/reception-desk/rooms` | Room Overview (§E.4). |
| `/hotel/reception-desk/guests` | Guest Lookup (§E.5). |
| `/hotel/reception-desk/orders` | Restaurant order visibility (§E.2), read-only. |
| `/hotel/reception-desk/staff` | Department Monitoring + Staff Status (§E.6), one screen, two sections. |
| `/hotel/notifications` (existing, reused) | Gets a third computed-alerts branch for Reception — hotel-wide, unlike Manager's/Staff's department-scoped ones (Reception already sees hotel-wide alerts via `getHotelAlerts`, which already exists and is already hotel-wide — this role literally needs zero new code here, just the nav to reach it). |

Reception nav (PRD §29, mirroring `MANAGER_NAV_ITEMS`'s pattern in `sidebar.tsx`): Dashboard,
Requests, Conversations, Rooms, Staff, Orders, Notifications. No desktop-only assumption — PRD §28
asks for responsive cards on mobile/tablet, which `RequestsBoard` and the new screens will get via
the same Tailwind responsive patterns already used elsewhere (not a dedicated bottom-nav rebuild
like the Staff module's — Reception is desktop/tablet-primary per its own PRD, mobile is a
responsive fallback, not the primary surface).

## H. Required APIs (new, under `/api/v1/hotel/`)

| Route | Purpose |
|---|---|
| `GET /api/v1/hotel/conversations` | List, `hotel_conversations` view grant. |
| `GET /api/v1/hotel/conversations/:id` | Thread detail. |
| `POST /api/v1/hotel/conversations/:id/messages` | Reception reply, `hotel_conversations` edit grant. |
| `GET /api/v1/hotel/orders` | List, `hotel_orders` view grant. |
| `GET /api/v1/hotel/orders/:id` | Detail. |
| `GET /api/v1/hotel/reception/dashboard` | KPI payload. |
| `GET /api/v1/hotel/reception/rooms` | Room Overview payload. |
| `GET /api/v1/hotel/reception/guests?q=` | Guest Lookup. |
| `GET /api/v1/hotel/reception/staff` | Department Monitoring + Staff Status payload. |

Two new `HOTEL_MODULES` entries (`lib/permissions.ts`): `hotel_conversations`, `hotel_orders` —
seeded for Reception only (`view+edit` and `view` respectively) in `hotel-roles.service.ts`'s
`DEFAULT_GRANTS`; Department Manager/Staff don't get them (neither PRD asks for it); `hotel_admin`
bypasses via its existing blanket-access shortcut. Every route: `requireHotelSession` →
`requireCanHotel(user, module, action)` → service call, identical shape to every existing route.

## I. Security risks

1. **Tenant isolation** — every new service function is scoped by `hotelId` from the session, same
   pattern as every existing one; every route derives it from `requireHotelSession`, never from a
   query param (PRD §32's exact worked example — `?hotel_id=HOTEL_B` — is already structurally
   impossible here, since no route signature accepts one).
2. **Conversation reply authorization** — `replyToConversation` verifies the conversation belongs to
   `hotelId` before writing (`findFirstOrThrow({ conversation_id, hotel_id })`), same "prove
   ownership before mutating" pattern as `requests.service.ts`. Role check is the coarse
   `hotel_conversations` `edit` grant (Reception + Hotel Admin only) — no per-conversation staff
   assignment logic is needed since any Reception user may reply to any conversation in their hotel
   (PRD §3, hotel-wide visibility, no departmental split for conversations).
3. **Order visibility is strictly read-only** — no status-mutation endpoint is added, closing off
   the one thing PRD §24 explicitly forbids ("do NOT build restaurant POS functionality").
4. **Data minimization (§37 of the Guest PRD, echoed by this PRD's §19/§23)** — Guest Lookup and
   Staff Status select only the fields the PRD explicitly lists (no internal staff notes, no
   unrelated personal data); mirrors the same minimization already applied in the Staff module's
   `REQUEST_INCLUDE`.
5. **No new attack surface on write paths** — the only new *write* capability this module adds is
   conversation replies; everything else (assign/reassign/escalate) reuses already-shipped,
   already-tested code paths.

## J. Implementation plan (build order, PRD §43 adapted)

1. `HOTEL_MODULES` + `DEFAULT_GRANTS` additions (`hotel_conversations`, `hotel_orders`), `roleName`
   branch in `postLoginPath`.
2. `conversations.service.ts` + its 3 routes.
3. `orders.service.ts` + its 2 routes.
4. `reception.service.ts` (dashboard, room overview, guest lookup, department/staff monitoring) +
   its 4 routes.
5. `Sidebar`'s `RECEPTION_NAV_ITEMS` branch.
6. Pages: dashboard, conversations (+ detail/reply), rooms, guests, orders, staff.
7. `RequestsBoard` extension (guest column, search, quick filters) — verify Hotel Admin's and the
   Manager Queue page's existing usage still renders correctly after.
8. `/hotel/notifications`'s Reception branch (trivial — reuses `getHotelAlerts` as-is).
9. Polling on Dashboard + Request Queue.
10. `tsc`/`vitest`/`lint`/`build`, then live verification (§K) against `PILOT-15`/`PILOT-110`,
    together with the Guest module so the conversation round trip is tested as a whole.
11. Regression pass on Super Admin, Hotel Admin/GM, Department Manager, Department Staff.

## K. Test plan

Same convention as every prior module in this app (pure-function Vitest + live HTTP verification —
no test in this codebase hits a real DB directly):

- **Tenant isolation (mandatory)**: Reception from Hotel A hitting any new route with Hotel B's ids
  → 404/403, never Hotel B data — same pattern already proven for Department Manager/Staff.
- **RBAC**: a Department Manager or Department Staff session hitting `/api/v1/hotel/conversations`
  or `/orders` → 403 (grants deliberately not seeded for those roles).
- **Assign/reassign/escalate as Reception** — confirms the *already-existing* backend capability
  (§A) actually works end-to-end through the new Request Queue screen, not just in theory.
- **Conversation round trip**: guest starts a conversation (Guest module) → appears in Reception's
  list → Reception replies → guest sees the reply — the Guest PRD §28 mandatory scenario, tested
  jointly with the Guest module's own verification pass.
- **15-room / 110-room scenarios (PRD §38/§39)**: identical Reception experience regardless of
  whether Department Managers exist — proven by construction (§A's routing-independence finding),
  reverified live.
- **Regression**: Super Admin, Hotel Admin/GM, Department Manager, Department Staff dashboards/nav/
  workflows unchanged — in particular, confirm `RequestsBoard`'s extension didn't alter Hotel
  Admin's or the Manager Queue page's rendering or behavior.

## L. Verification (2026-08-16)

`tsc --noEmit`, `next lint`, and `next build` all clean (68 → includes every new Reception route/
page). `vitest run`: 9/9 unchanged (no new pure-logic surface in this module — same reasoning as
§K).

Live, through the real HTTP API (NextAuth cookie login, no bypass), against `PILOT-15`:

- **RBAC seeding**: created a Reception user (Meera) via the existing `POST /api/v1/hotel/reception`
  flow — `getOrCreateHotelRole`'s grant sync (§J's "backfill missing grants" fix) produced exactly
  the intended `role_permissions` rows, including the two new modules
  (`hotel_conversations: view+edit`, `hotel_orders: view`), verified directly against the DB.
- **Login + landing**: Meera logs in, `roleName: "Reception"` in session, root `/` redirects to
  `/hotel/reception-desk/dashboard` (200).
- **Dashboard KPIs**: hotel-wide counts (new/unassigned/in-progress/escalated/high-priority/
  completed-today/SLA-at-risk/unread-messages) returned correctly and changed live as test data was
  created/updated during this session.
- **Conversation round trip (Guest PRD §28's mandatory scenario)**: seeded a guest message → showed
  up in Meera's conversation list with `hasUnreadGuestMessage: true` → Meera replied via
  `POST .../messages` → `hasUnreadGuestMessage` flipped to `false` on the next dashboard read → the
  guest side (via the Guest module, tested jointly — see `guest-implementation-plan.md` §Verification)
  saw the reply. Full loop confirmed working end to end, not just each side in isolation.
- **Assign/reassign/escalate as Reception**: confirmed the pre-existing backend capability (§A) now
  actually reachable — Meera hit `/hotel/requests` (the shared Request Queue), the page rendered with
  the new Guest column and search/quick-filter chips, hotel-wide, exactly as designed.
- **Room Overview / Guest Lookup**: issued a real guest session through Reception's own
  `issueGuestSession` flow (room 101, PIN captured) — Room Overview correctly showed it `occupied`
  with the right `activeGuestSessionId` and open-request count; Guest Lookup found it by room number
  and by guest name.
- **Orders visibility**: a guest-placed order (via the Guest module) appeared in
  `/hotel/reception-desk/orders` with correct room/guest/items/total — read-only, no status-change
  affordance present, matching §I.3.
- **RBAC boundary (mandatory)**: logged in as Raju (Department Staff) and separately as Anita
  (Department Manager) — both got `403 Forbidden` on `/api/v1/hotel/reception/dashboard`,
  `/api/v1/hotel/reception/staff`, `/api/v1/hotel/conversations`, and `/api/v1/hotel/orders`,
  confirming both the `requireReceptionOrAdmin` role guard (for the four aggregate routes that reuse
  pre-existing module flags Department Manager/Staff also hold) and the plain module-grant check
  (for the two brand-new modules) work as designed. `hotel_admin` (Suresh) confirmed able to reach
  all of the same routes via its blanket-access bypass.
- **Regression**: Suresh's Hotel Admin dashboard, Anita's Manager Queue, and Raju's Staff Home all
  re-verified reachable and correct after every change in this module — no shared-component
  regression from the `RequestsBoard` extension or the `getOrCreateHotelRole` grant-sync change.
