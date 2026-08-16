# Guest Module — Implementation Plan

Status: **built and verified** (2026-08-16). See §13 for the verification run. Written against
the PRD (`docs/RoomLink_V1_Guest_PRD.pdf`, V1.0) after inspecting the already-built Super Admin,
Hotel Admin/GM, Department Manager, and Department Staff modules, per the PRD's own §40 process.

Both decisions originally flagged in §4.1 and §4.6 are resolved:

- **§4.1 (schema migration)**: approved and applied —
  `packages/db/prisma/migrations/20260816200000_guest_session_fk_and_actor_type/`. See §5.
- **§4.6 (Reception)**: Reception is a full module, built inside `apps/hotel-admin` (not folded into
  this app, and not a minimal inbox) — see `docs/hotel-admin/reception-implementation-plan.md`. This
  module's `/reception` conversation screens are a client of the tables Reception's module reads/
  writes; neither module duplicates the other's logic. Both modules are being built together so the
  guest→Reception→guest round trip (PRD §28's mandatory test) is verifiable end-to-end.

## 1. Objective

Build the guest-facing surface of RoomLink: scan a room's QR, verify with a PIN, get a temporary
session, and from there contact Reception, request services, order food, and track both — as a new,
separate deployable (`apps/guest`), matching this repo's established "one architecture, several
audiences, several apps" principle (`architecture.md`). Nothing in Super Admin, Hotel Admin/GM,
Department Manager, or Department Staff should change behavior.

## 2. Current architecture (what already exists, checked before proposing anything)

The single most important finding: **the guest-session data model already exists and is exactly
right** — it was built during the Hotel Admin/GM module specifically so this module could be added
later without a migration for the session itself (`architecture.md`'s "Guest-facing scope" note says
this outright: "guests are assumed to interact through a separate, not-yet-built surface").

| Piece | State | Detail |
|---|---|---|
| `guest_sessions` table | **Exists, correct, unused by any guest-facing code yet.** | `session_id, hotel_id, room_id, guest_id?, session_token (unique), pin_hash, issued_at, expires_at, status (active/expired/terminated), terminated_by?, terminated_at?`. `issueGuestSession()` (`apps/hotel-admin/src/server/services/guest-sessions.service.ts`) is the Reception "check-in" action that creates one: generates a 6-digit PIN, bcrypt-hashes it, generates a 24-byte `session_token`, sets `expires_at = now + hoursValid` (Reception-supplied, default 48h), and — critically — **terminates any other active session for that room first**, so there is only ever one live session per room. This single invariant already satisfies most of PRD §7/§27 (old QR photo can't restore access, because the session it pointed at was terminated the moment the next guest checked in) — no new logic needed for it, just the guest-facing consumption of it. |
| `qr_codes` table | **Exists, correct.** | `code_value` (unique, opaque, already the identifier printed/embedded in the physical QR), `is_active`, tied to a `room_id`. This is the "QR only identifies HOTEL + ROOM, not a credential" object PRD §2 describes exactly — the guest module will look a code up by this value, never trust a hotel/room id from the client. |
| `guests` table | **Exists.** | Lightweight: `full_name?, phone?, email?, check_in_date?, check_out_date?`, optional (Reception may issue a session without capturing a name — see §4.2). |
| Guest-facing session/auth mechanism | **Missing entirely.** | No login surface, no cookie, no "who is this guest" resolution anywhere. This is this module's core deliverable. |
| `requests` / `request_status_history` | **Exist, correct status model.** | `pending → assigned → in_progress → completed`, plus `cancelled`/`escalated` (added by the Hotel Admin module). `priority` enum, `notes` field (the guest's free-text note). This is the exact status set PRD §13 asks the guest to see (minus `escalated`, an internal-only state — see §4.4). |
| `conversations` / `messages` | **Exist in the schema, used by zero code anywhere in either app.** | `sender_type` enum already includes `guest` (designed for this from the start); `messages.sender_id` is documented as "resolves to guest_id or user_id depending on sender_type, not a declared FK" — i.e. already built to accept a guest sender. No Reception-side inbox UI exists to *read* them yet (see §4.6). |
| `menu_categories` / `menu_items` / `orders` / `order_items` | **Exist, correct, configured by Hotel Admin, consumed by nobody yet.** | `menu_items` has `is_veg`, `is_available`, `status`, `price`, `image_url`, `description` — everything PRD §16 asks the guest to see. `order_status`: `pending → preparing → out_for_delivery → delivered`, plus `cancelled` — see §4.5 for the "ACCEPTED" step PRD mentions but the schema doesn't have. |
| `services` | **Exists, correct.** | Hotel-configured guest-service catalogue (Extra Towels, AC Issue, …), `department_id?`, `status`. Exactly PRD §11's "Request Service" catalogue — filtered by `status = 'active'` and the department being `is_enabled`. |
| `hotels` / `hotel_settings` | **Exist, correct, already extended for this.** | `hotels` carries `check_in_time`, `check_out_time`, `time_zone`, address/phone/email, `breakfast_time`, `restaurant_time` (added by the Hotel Admin module). `hotel_settings` (1:1) carries `welcome_message`, `guest_instructions`, `wifi_name`, `wifi_password`. PRD §21's entire "Hotel Information" screen is already fully backed by data — no new columns needed. |
| Notifications | **No `notifications` table anywhere; computed-alert pattern only.** | Both the Department Manager and Department Staff modules deliberately did not build stored notifications (`alerts.service.ts` — live queries, not a queue), an explicit, already-logged non-goal for V1. Guest notifications follow the same precedent (§4.7) — no schema change. |
| Push notifications | **No infrastructure exists anywhere** (no service worker push handling, no VAPID keys, no subscription table). | Same non-goal, same precedent as the Staff module's PWA work — in-app only for V1 (PRD §20 explicitly allows this: "Do not block core functionality if push permission is denied"). |
| PWA | **Exists, on `apps/hotel-admin` and `apps/super-admin`.** | `next-pwa`, `manifest.ts`, `InstallPrompt` — a template to port, same as the Staff module did for `apps/hotel-admin`. |
| Auth pattern to mirror (not reuse directly) | `apps/hotel-admin`'s `requireHotelSession`/`requireHotelPageSession` + NextAuth JWT. | Guests aren't `users` rows — no password, no role, no NextAuth. The guest module needs its own, smaller analog: a DB-backed opaque session token in an httpOnly cookie, verified server-side on every request. See §4.3. |
| Design system | `packages/ui` (`Card`, `Button`, `Modal`, `Select`, `Textarea`, `StatusBadge`, `KpiCard`, `FormField`, format helpers), Tailwind brand palette. | Fully reusable as-is — same components the Staff module's mobile-first cards were built from. |

## 3. Decision: new app, `apps/guest`

The task instructions confirm this directly ("This will be a separate sub module like hotel-admin
and super-admin"), and it matches the repo's own stated principle: different audiences get different
deployables sharing one `packages/db` schema and one `packages/ui` kit
(`architecture.md`: "Two separate deployables, one database... applied instead to portals"). A guest
has no password, no role, no `users` row, and a completely different security model (a temporary,
anonymous-by-default, DB-token session vs. a permanent staff account) — folding it into
`apps/hotel-admin` would mean bolting a second, incompatible auth system onto an app whose entire
`middleware.ts`/`requireHotelSession` design assumes NextAuth JWTs. A new app is the smaller, safer
change.

Port `3002` (super-admin defaults to 3000, hotel-admin is pinned to 3001). New root scripts
`dev:guest`/`build:guest`, same pattern as the existing two.

## 4. Contradictions found → resolutions (same format as the Hotel Admin and Staff modules' docs)

### 4.1 — Stay isolation has no data to enforce it on ✅ **resolved — migration applied**

PRD §26/§27 mandate: a later guest in the same room must never see an earlier guest's requests,
orders, or conversations — this is called out as a **mandatory test**, not a nice-to-have.

**The gap**: `requests`, `orders`, and `conversations` each have a nullable `room_id` and a nullable
`guest_id` — but no column at all tying a row to *which stay/session* created it. `guest_id` can't
carry this weight alone: Reception can issue a `guest_sessions` row without capturing a guest name
(`issueGuestSession`'s `guestName` is optional), which is common (many hotels don't collect a name
at check-in for a quick digital check-in), so `guest_id` is frequently `null`. Without a stay
identifier, the only way to scope "this stay's data" would be a time-window heuristic
(`created_at BETWEEN session.issued_at AND session.expires_at`) — which is exactly the kind of
fragile, easy-to-get-subtly-wrong logic a *mandatory* security test shouldn't depend on, and breaks
outright the moment a session is terminated early (checkout before the booked `expires_at`) rather
than naturally expiring.

**Proposed resolution**: add a nullable `guest_session_id UUID` FK (→ `guest_sessions.session_id`) to
`requests`, `orders`, and `conversations`. Purely additive, all three columns nullable (existing
Reception/Hotel-Admin-created rows simply have it `null`, exactly like `guest_id` already works
today — no existing query breaks, no existing row loses data). The guest app sets it on every
create; every guest-facing list/read query filters by it directly
(`WHERE guest_session_id = currentSessionId`) instead of by time-window or `guest_id`. This makes
stay isolation exact and trivial to verify, matching how `departments.manager_id` and
`requests.assigned_to` already solve the same "which of several plausible owners is this row's real
owner" shape of problem elsewhere in this schema.

**Also needed**: `actor_type` gets a new enum value, `guest`, so `audit_logs` can correctly attribute
guest-initiated events (`request.created`, `order.created`, `conversation.started`, …) instead of
misusing `system` for something a guest actually did. Purely additive (new enum value, existing rows
unaffected) — same kind of change the Hotel Admin module already made twice to `request_status`
(`assigned`, `escalated`).

**Applied.** `packages/db/prisma/migrations/20260816200000_guest_session_fk_and_actor_type/`:
`guest_session_id UUID?` added to `requests`/`orders`/`conversations` (FK → `guest_sessions`,
indexed), `actor_type` gained `guest`. `tsc --noEmit`/`vitest run` re-verified clean on both
`apps/hotel-admin` and `apps/super-admin` immediately after, confirming the additive change touched
nothing existing.

### 4.2 — "Stay" has no dedicated table, and doesn't need one

PRD §3's diagram shows `HOTEL → ROOM → STAY → GUEST SESSION → REQUESTS/ORDERS/…`, suggesting `STAY`
and `GUEST SESSION` might be two different entities. They aren't, in this schema, and shouldn't
become two: a `guest_sessions` row already *is* the stay, for RoomLink's purposes — it has the
hotel, room, optional guest, issued/expiry timestamps, and a status lifecycle
(`active → expired/terminated`). Introducing a separate `stays` table would just be a second
almost-identical entity with no distinct data of its own to hold. Resolution: **"stay" = the current
`guest_sessions` row**, documented as such rather than built as a new table.

### 4.3 — Guest auth mechanism (new, small, mirrors the existing pattern)

No schema change needed — `guest_sessions.session_token` (already generated, already unique, already
unused by anything) is the credential. Flow:

1. `POST /api/guest/session { codeValue, pin }` — **never** `{ hotelId, roomId }` from the client
   (PRD §5/§24). Server resolves `qr_codes.code_value → room → hotel`, confirms the room's `status`
   is `active`, finds that room's currently `active` `guest_sessions` row, `bcrypt.compare(pin,
   pin_hash)`. On match: `Set-Cookie: rl_guest_session=<session_token>; HttpOnly; Secure (prod);
   SameSite=Lax`, `Max-Age` capped at the session's `expires_at`.
2. `requireGuestSession(req)` (every API route) — reads the cookie, looks up `guest_sessions` by
   `session_token`, requires `status === 'active' && expires_at > now()`, returns
   `{ sessionId, hotelId, roomId, guestId }`. This is the guest module's `requireHotelSession`
   equivalent, and it's the *only* place identity is derived — no route ever reads a client-supplied
   `hotelId`/`roomId`/`sessionId`, matching PRD §24/§25 verbatim.
3. `requireGuestPageSession()` (every page) — same check, redirects to the PIN-entry/error page
   instead of throwing a 401. Same defense-in-depth reasoning
   `require-hotel-page-session.ts`'s own comment already documents: a layout-level guard alone isn't
   enough, every page defends itself.
4. **No `middleware.ts` coarse gate, unlike `apps/hotel-admin`'s** — and this is a deliberate,
   explained deviation, not an oversight. Hotel Admin's `middleware.ts` can cheaply check a NextAuth
   JWT at the edge because the JWT is self-contained (no DB call). A DB-backed opaque token
   (`session_token`) can't be verified that way without Prisma-over-edge infrastructure this project
   doesn't have. Rather than add a fake "checks cookie presence but not validity" middleware that
   looks like a security layer but isn't one, the real check lives once, authoritatively, in
   `requireGuestPageSession`/`requireGuestSession` — the same place `navigation-and-permissions.md`
   already says is where enforcement "actually happens" for every other role's inline checks.
5. Logout (PRD §23): `POST /api/guest/session/end` — sets `guest_sessions.status = 'terminated'`
   (defense in depth: even a leaked cookie value stops working) and clears the cookie.

### 4.4 — Guest-facing request status: hide `escalated`

`request_status` has `pending / assigned / in_progress / completed / cancelled / escalated`. PRD
§13's guest-facing stepper only shows five: `NEW / ASSIGNED / IN_PROGRESS / COMPLETED / CANCELLED`.
`escalated` is an internal operational signal (a Department Manager routing something to the GM) —
exposing it to the guest would leak an internal-only concept and doesn't correspond to anything a
guest should read differently. Resolution: the guest UI maps `escalated` to the same visual step as
`in_progress` ("Being Prepared") — no schema change, purely a display-layer decision, matching PRD
§37's privacy principle ("do not expose... internal administrative information").

### 4.5 — Order status: reuse the existing five, don't add "ACCEPTED"

PRD §17 describes `NEW → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`. `order_status` has
`pending → preparing → out_for_delivery → delivered → cancelled` — four forward states, not five.
Unlike the request-status gap the Hotel Admin module found (which it fixed by extending the enum,
because Department Manager/Staff actively transition requests through those states), **nothing in
this codebase transitions an order's status at all yet** — no Restaurant-staff order-management
screen exists anywhere (confirmed: no route, no service, on either app). Adding an `accepted` value
now would create a state nothing can ever move a guest's order into or out of, purely speculative.
Resolution: reuse the existing four forward states; the guest UI's "Order Received" step **is**
`pending` (collapsing NEW+ACCEPTED into one step, same principle as `request_status`'s `pending`
already standing in for "received"). Building the Restaurant-side screens that actually move orders
through these states is explicitly out of scope for this module (see §11) — same "your
responsibility is only the Guest side" boundary the task instructions state directly.

### 4.6 — Reception's conversation inbox: built as its own module, in `apps/hotel-admin`

PRD §10 requires the full loop: guest starts a conversation → **Reception receives it → Reception
replies** → guest sees the reply. Resolved directly: Reception is being built as a full module
(`docs/hotel-admin/reception-implementation-plan.md`), inside `apps/hotel-admin`, alongside this
one — not a minimal bolt-on inbox. This guest module owns conversation *creation* and the guest's
own read view; the Reception module owns the operational inbox (list, open, reply) and everything
else Reception PRD asks for (dashboard, queue, rooms, orders, department/staff monitoring). Both
read/write the same `conversations`/`messages` tables — no duplicated logic, matching PRD §10's "do
not create a separate chat database" instruction on both sides.

### 4.7 — Guest notifications: computed, not stored (same precedent as Staff/Manager)

No `notifications` table exists, and the last two modules both deliberately declined to add one
(`getDepartmentAlerts`/`getStaffAlerts` in `alerts.service.ts` are live queries, not a queue). Guest
notifications follow the same shape: `GET /api/guest/notifications` computes a feed from the current
session's own `request_status_history` and `orders.status` changes (both already timestamped),
newest first, no persisted read-state — matching PRD §19's list exactly (request accepted/started/
completed/cancelled, order accepted/preparing/out-for-delivery/delivered, Reception message) without
new infrastructure.

## 5. Database changes (applied — §4.1)

```
requests       + guest_session_id  UUID?  REFERENCES guest_sessions(session_id)
orders         + guest_session_id  UUID?  REFERENCES guest_sessions(session_id)
conversations  + guest_session_id  UUID?  REFERENCES guest_sessions(session_id)
actor_type     + 'guest'  (new enum value)
```

All four changes are additive (nullable columns, new enum value) — no existing row loses data, no
existing query in `apps/hotel-admin` or `apps/super-admin` needs to change. One new Prisma migration
in `packages/db/prisma/migrations/`, applied the same way the Hotel Admin module's two migrations
were.

## 6. Required APIs (new `apps/guest/src/app/api/guest/*`)

Matches PRD §35 exactly, plus the logout endpoint §23 needs but §35's list omits:

| Route | Purpose |
|---|---|
| `POST /api/guest/session` | PIN verification → issues the guest cookie (§4.3). |
| `POST /api/guest/session/end` | Logout — terminates the session, clears the cookie. |
| `GET /api/guest/me` | Hotel name/room number/guest name (if captured)/session status — for Home and Profile. |
| `GET /api/guest/services` | Enabled services for the hotel, grouped by department (§11). |
| `POST /api/guest/requests` | Create a service request, scoped to the current session. |
| `GET /api/guest/requests` | List this stay's requests only (`guest_session_id` filter). |
| `GET /api/guest/requests/:id` | Detail — 404s if it doesn't belong to the current session. |
| `GET /api/guest/menu` | Categories + items, `is_available && status === 'active'` only. |
| `POST /api/guest/orders` | Place an order (cart → `orders` + `order_items`, snapshot price). |
| `GET /api/guest/orders` | This stay's orders only. |
| `GET /api/guest/orders/:id` | Order detail. |
| `POST /api/guest/conversations` | Start a conversation (or post into the existing open one — one open conversation per session, mirroring `guest_sessions`' "one active thing" pattern). |
| `GET /api/guest/conversations` | This stay's conversation + messages. |
| `GET /api/guest/notifications` | Computed feed (§4.7). |
| `GET /api/guest/hotel-info` | Hotel + `hotel_settings` fields for the Hotel Information screen. |

Every route above starts with `requireGuestSession(req)` and derives `hotelId`/`roomId`/`sessionId`
from it — never from the request body/query, per §4.3/PRD §24.

## 7. Required pages (`apps/guest/src/app/`)

| Route | Purpose |
|---|---|
| `/r/[code]` | QR landing — resolves `code_value`, shows hotel/room, renders PIN entry or the appropriate error state (§8 below). Redirects straight to `/home` if a valid session cookie for this room already exists. |
| `/home` | Guest Home — welcome + room number + the six action cards (§9/§10 of the PRD). |
| `/reception` | Conversation thread + send box. |
| `/services` | Service categories → item picker → quantity/note → submit. |
| `/requests` | My Requests list (this stay only), status stepper per card. |
| `/requests/[id]` | Request detail. |
| `/menu` | Restaurant menu, category tabs, add-to-cart. |
| `/cart` | Review cart, place order. |
| `/orders` | Order history (this stay only). |
| `/orders/[id]` | Order detail, status stepper. |
| `/notifications` | Computed feed. |
| `/hotel-info` | Static hotel info from `hotels`/`hotel_settings`. |
| `/profile` | Name (if captured)/room/hotel/stay dates + "End Session". |
| `/more` | The bottom nav's overflow — Reception/Request Service/Order Food/Hotel Info/Profile. |
| `/session-ended` | Landed on whenever `requireGuestPageSession` can't establish a valid session. |

Bottom nav (PRD §32): **Home / Requests / Orders / Notifications / More** (`More` opens
Reception/Menu/Hotel Info/Profile — five primary destinations plus an overflow, since the PRD lists
six home actions but recommends five nav slots). This is the *only* nav — no desktop sidebar; the
guest app is mobile-first by default for every user, not role-conditional like `StaffBottomNav`.

## 8. Error states (PRD §6/§36 — implemented as distinct, named states, not one generic error page)

`Invalid QR` · `Room inactive` · `No active stay` · `Session expired` · `Invalid PIN` ·
`Unauthorized/Forbidden` (session missing or another stay's resource) · `Service unavailable` ·
`Menu item unavailable` · `Request creation failed` · `Order failed` · `Network/offline`. Each with
the PRD's exact copy where specified (§6), and a `[Contact Reception]` fallback action per §6.

## 9. Security (the load-bearing section, per PRD §24/§25/§26 all being marked mandatory/critical)

1. **Identity is never client-supplied.** Every route derives `hotelId`/`roomId`/`sessionId`/
   `guestId` from `requireGuestSession`'s cookie→DB lookup, never from `?hotelId=`/body fields —
   exactly PRD §24's worked example.
2. **Tenant isolation**: every query is scoped by the session's `hotelId`, same pattern as every
   existing hotel-admin service.
3. **Stay isolation**: every guest-facing list/read filters by `guest_session_id` (§4.1/§5) — not
   `room_id` (which is stable across many different guests over time) and not `guest_id` alone
   (frequently null). This is what makes PRD §26/§27's mandatory tests pass by construction rather
   than by a fragile time-window check.
4. **QR reuse (§27)**: covered by an existing invariant (`issueGuestSession` terminates the prior
   active session for a room before creating a new one), plus `expires_at` as a hard backstop even if
   a room somehow isn't re-issued promptly. A photographed old QR only ever re-resolves to
   `hotel_id + room_id` (never sensitive by itself, per §2) — it cannot, by itself, produce a valid
   session; the guest would still need the *current* PIN, which changes every time Reception issues
   a new session.
5. **PIN verification** is `bcrypt.compare`, timing-safe by construction (bcrypt); no PIN is ever
   returned by any guest-facing endpoint (only shown once, to Reception, at issuance — unchanged,
   existing behavior).
6. **Cookie**: `HttpOnly` (unreadable to any injected/XSS'd script), `Secure` in production,
   `SameSite=Lax` (sent on top-level navigation, e.g. following the QR link, but not on cross-site
   POSTs — appropriate for a bearer-style session token).
7. **Data minimization (§37)**: guest-facing queries select only guest-relevant fields — no internal
   staff notes, no other guests' data, no staff personal contact details (mirrors the Staff module's
   existing `REQUEST_INCLUDE` minimization, applied fresh here since this is a new query surface).
8. **Audit (§38)**: `guest_session.created`, `.expired`(on read-time lazy detection), `.terminated`,
   `request.created`, `order.created`, `conversation.started` — via the same `recordAudit`/
   `audit_logs` pattern every other module uses, `actor_type = 'guest'` (§4.1), `actor_id = guestId`
   when known, else `null`.

## 10. Test plan

Same split the Staff module's plan settled on, since it matches this codebase's actual convention
(pure-function Vitest + live HTTP verification — no test anywhere hits a real DB directly):

- **Vitest**: PIN-format validation, cart subtotal math, request/order status→display-step mapping
  (§4.4/§4.5) — pure functions, same shape as `transitions.test.ts`/`sla.test.ts`.
- **Live verification**, real HTTP, against the seeded pilot hotels, covering every PRD §42
  Definition-of-Done item — most importantly:
  - **Mandatory (§27, QR reuse)**: Guest A's session from an earlier stay cannot be resurrected by
    re-scanning/re-entering data after checkout; a fresh PIN is required.
  - **Mandatory (§26, stay isolation)**: two sequential stays in the same room, verified via
    `guest_session_id`, second guest sees zero rows from the first.
  - **Mandatory (§25, tenant isolation)**: a guest session from Hotel A hitting any `/api/guest/*`
    route with Hotel B's ids returns 404/401, never another hotel's data.
  - **§28 (110-room)**: full request lifecycle guest→Housekeeping→staff-complete→guest-sees-completed;
    full order lifecycle; full conversation round-trip (pending §4.6's resolution).
  - **§29 (15-room, no Department Manager, multi-department staff)**: identical guest experience,
    proving the guest module has no dependency on whether the hotel has managers — it only ever talks
    to `department_id`, never to who manages it.
  - **Regression**: Super Admin, Hotel Admin/GM, Department Manager, Department Staff all
    re-verified unaffected (§42) — nothing in this module changes any of their code paths except the
    additive schema columns (§5) and, if §4.6(a) is chosen, the new Reception inbox screen.

## 11. Explicitly out of scope

- Restaurant/Kitchen staff order-management UI (accept/prepare/mark-out-for-delivery) — no such
  screen exists anywhere yet; guests can place and track orders, but nothing in this module builds
  the staff side that moves them forward. Same "your responsibility is only the Guest side" boundary
  the task instructions state.
- Push notifications — no infrastructure exists (§2); in-app only for V1, same precedent as the
  Staff/Manager modules.
- Payment collection — PRD doesn't ask for it; `orders.total_amount` is informational only, matching
  "keep V1 simple" (§17).
- A full permanent guest customer-account system (§22 explicitly rules this out) — identity stays
  tied to the stay/session, not a reusable login.
- Reception module generally, beyond the minimal inbox in §4.6(a) if that option is chosen —
  reassignment, escalation-from-Reception, etc. stay Department-Manager/Hotel-Admin territory,
  unchanged.

## 12. Build order (PRD §41, adapted)

1. Schema migration (§5) — done.
2. `apps/guest` scaffold (package.json, tailwind/tsconfig/eslint/postcss, ported from
   `apps/hotel-admin`), `db.ts`/`audit.ts` per-app reimplementation (matching the existing
   per-app-not-shared convention).
3. `requireGuestSession`/`requireGuestPageSession`, `POST /api/guest/session`, `/r/[code]` landing +
   PIN entry + every error state (§8).
4. `GET /api/guest/me`, `/home`.
5. `GET /api/guest/services`, `/services`.
6. `POST /api/guest/requests`, `GET /api/guest/requests(/:id)`, `/requests`, `/requests/[id]`.
7. `POST`/`GET /api/guest/conversations`, `/reception` — built alongside the Reception module's own
   inbox (`docs/hotel-admin/reception-implementation-plan.md`) so the round trip can be verified as
   each side lands.
8. `GET /api/guest/menu`, `/menu`, `/cart`.
9. `POST`/`GET /api/guest/orders(/:id)`, `/orders`, `/orders/[id]`.
10. `GET /api/guest/notifications`, `/notifications`.
11. `GET /api/guest/hotel-info`, `/hotel-info`, `/profile`, `POST /api/guest/session/end`.
12. Bottom nav, PWA (ported from `apps/hotel-admin`).
13. `tsc`/`vitest`/`lint`/`build`, then live verification (§10) against `PILOT-15`/`PILOT-110`,
    including a fresh QR/session issued through the real Reception flow for each.
14. Regression pass on the four existing modules; docs updated
    (`docs/guest/architecture.md` and this file's own status/verification section).

All phases complete — see §13 for the actual run and results.

## 13. Verification (2026-08-16)

`tsc --noEmit`, `next lint`, and `next build` all clean — 28 routes (14 pages, 14 API routes,
`manifest.webmanifest`, root fallback). `vitest run`: a new small suite for the one genuinely
pure-logic surface this module has — `toGuestRequestStatus`'s escalated→in_progress mapping and the
guest-facing status label tables (§4.4/§4.5) — 4/4 passing. No DB-hitting tests, matching this
codebase's actual convention (established while building the Staff module's plan, confirmed again
here — see `staff-implementation-plan.md` §9).

Two implementation notes worth recording, since they weren't decided in the original plan:

- **No JWT/signed-cookie wrapper** — the cookie is the raw `guest_sessions.session_token` value
  directly (httpOnly/secure-in-prod/sameSite=lax), verified by a DB lookup on every request. This is
  what §4.3 described, but it's worth being explicit that no additional signing layer was added on
  top — the opaque, unique, randomly-generated token *is* the credential, same trust model as a
  traditional server-side session id.
- **Cart state** is client-side only (`localStorage`, a small `CartProvider` context), not persisted
  server-side until "Place Order" — matches PRD §16's add/remove/quantity-change/view-cart being
  pre-order actions, and keeps the guest module from needing a `cart`/`cart_items` table for
  something that's inherently ephemeral per PRD's own "keep V1 simple" instruction (§17).

Live, through the real HTTP flow (QR landing → PIN → cookie session, no bypass), against the seeded
`PILOT-15` hotel (`docs/hotel-admin/staff-implementation-plan.md`'s Raju — Housekeeping + Restaurant
+ Maintenance, no Department Manager — made this the natural hotel to verify PRD §29's exact
scenario against) and jointly with the Reception module's own verification pass
(`docs/hotel-admin/reception-implementation-plan.md` §L):

- **QR landing, all error states real, not simulated.** The seeded PILOT-15 QR for room 101 already
  happened to be `is_active: false` (leftover from earlier Hotel Admin QR-lifecycle testing) — hit
  that real inactive code first and got "This RoomLink QR is not valid." with no code changes needed
  to produce it. Reactivated it, then hit "This RoomLink session is not currently active" for the
  same room *before* any guest session existed for it (also real, not simulated) — both of PRD §6's
  negative states confirmed against actual, not fabricated, conditions before ever testing success.
- **Full first-request loop, PRD §29's exact scenario**: issued a real session via Reception (Meera,
  the same account created in the Reception module's own verification), verified via the real PIN
  over `POST /api/guest/session`, confirmed a distinct "Incorrect PIN" message for a wrong PIN vs.
  the generic session-expired message for no cookie at all. As "Tanmay": submitted **Extra Towels**
  (Housekeeping) and **AC Issue** (Maintenance) — both routed correctly by department, both accepted/
  started/completed by Raju (the PILOT-15 Department Staff member in all three departments, PRD §29's
  own worked example), both showed **Completed** back on the guest side afterward. Restaurant: seeded
  a menu item, placed a 2-item order, watched `pending → preparing` reflected live in
  `GET /api/guest/orders/:id` after Reception/a staff-side update, with a matching notification
  ("Your restaurant order is Preparing") appearing in the guest's computed feed.
- **Conversation round trip (mandatory, PRD §28)**: guest message → appeared in Reception's inbox
  with `hasUnreadGuestMessage: true` → Reception replied → guest saw the reply via
  `GET /api/guest/conversations` — full loop, both sides real HTTP, not mocked. Detail in
  `reception-implementation-plan.md` §L.
- **Tenant isolation (mandatory, §25)**: the PILOT-15 guest session fetching a PILOT-110 request id
  directly → `404`, indistinguishable from "doesn't exist."
- **Stay isolation (mandatory, §26) and QR reuse (mandatory, §27) — tested together, since issuing a
  new session is what naturally exercises both**: had Reception issue a *second* session for the
  *same* room 101 (simulating a new guest checking in) — confirmed the first guest's ("Tanmay")
  session was immediately rejected (`401`, "Your session has expired") the moment the new one was
  issued, *before* even reaching its own `expires_at`. Verified the old PIN no longer works against
  the new active session (naturally — PIN verification checks against whichever session is currently
  `active` for the room, and there is only ever one). Logged in as the new guest ("Priya Guest B")
  with the new PIN and confirmed `GET /api/guest/requests`, `/orders`, and `/conversations` all
  returned empty/`null` — zero visibility into Tanmay's Extra Towels request, AC Issue request,
  Biryani order, or late-checkout conversation, despite being the same room. This is the `guest_
  session_id`-scoping design (§4.1) working exactly as intended, not a time-window heuristic that
  happened to hold.
- **Session expiry (§7)**: force-expired Guest B's session directly in the DB — the next API call
  returned `401`, and the next *page* request redirected to `/session-ended` (not a crash, not a
  silent pass-through) — confirms both `requireGuestSession` (API) and `requireGuestPageSession`
  (pages) independently enforce the same expiry check, matching the "every layer defends itself"
  convention this codebase already established for the staff apps.
- **Regression**: Hotel Admin (Suresh), Department Manager (Anita), Department Staff (Raju), and
  Reception (Meera) dashboards all re-verified reachable and correct after the full Guest module
  build — no shared-component or shared-table regression from the new `guest_session_id` columns or
  any guest-side write path.

Not independently re-verified this session (unchanged by this module): Super Admin's own portal.
