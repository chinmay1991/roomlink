# Hotel Admin / GM — Architecture

## Workspace layout

RoomLink is an npm workspace monorepo with two independent Next.js apps and two shared packages,
all against one Postgres database (`rmdb`):

```
claude-code/
  package.json                 workspace root ("workspaces": ["apps/*", "packages/*"])
  apps/
    super-admin/                RoomLink HQ portal (pre-existing, unchanged in behavior)
    hotel-admin/                Hotel Admin / GM portal (this module)
  packages/
    db/                         shared Prisma schema + client — the ONE schema both apps use
    ui/                         shared UI kit (Button, Card, Input, Select, Modal, StatusBadge,
                                 KpiCard, FormField, format helpers) — consumed by hotel-admin;
                                 super-admin keeps its own pre-existing local copies untouched
  docs/
    hotel-admin/                this documentation
    RoomLink Schema.md          canonical schema reference (predates this module; superseded in
                                 places by packages/db/prisma/schema.prisma — see schema-changes.md)
```

Two separate deployables, one database. This is the same principle the PRD applies to hotel
staffing models ("one architecture, no forks") applied instead to portals: Super Admin and Hotel
Admin are different audiences with different login surfaces, so they're different apps, but they
must never diverge on what a "department," "request," or "staff member" *is* — hence one shared
`packages/db` schema.

## Auth — two independent logins, one shared session shape

`apps/hotel-admin` has its own NextAuth config (`src/server/auth.ts`), completely independent of
`apps/super-admin`'s. It only ever authenticates `user_type IN ('hotel_admin', 'hotel_staff')` and
requires `hotel_id IS NOT NULL` — nothing else can sign in here. The JWT/session carries
`{ id, userType, roleId, hotelId }`; `hotelId` is set once at login from `users.hotel_id` and never
re-derived from anything the client sends afterward.

Super Admin's own login is untouched — it still only accepts `super_admin`/`support_staff`, exactly
as before this module existed.

## Tenant isolation — the load-bearing security property

Every `/api/v1/hotel/*` route starts with:

```ts
const { user } = await requireHotelSession(req)   // src/server/require-hotel-session.ts
```

`user.hotelId` comes **only** from the session. No route handler ever accepts a `hotel_id` from the
request body/query and trusts it. Every Prisma query in every service function is scoped by
`hotelId` (`findFirstOrThrow({ where: { ..., hotel_id: hotelId } })` or an equivalent join filter).

**This alone is not enough** — a route can correctly scope its own record by `hotel_id` while still
accepting a *different* record's id as a foreign key (e.g. "create a request for `hotelId`, but
pointing at someone else's `roomId`"). Every service function that accepts a client-supplied id
referencing another hotel-owned table (`roomId`, `departmentId`, `categoryId`, `assigneeId`,
`managerId`) proves that id belongs to `hotelId` before using it — see `schema-changes.md`'s
"Cross-tenant FK validation" note for the specific functions this applies to and why it was added
after testing caught the gap.

## RBAC — two parallel systems, same tables

`apps/hotel-admin/src/server/hotel-rbac.ts` mirrors the shape of Super Admin's `rbac.ts` but is
entirely separate: its own `HOTEL_MODULES` list (`src/lib/permissions.ts`), its own `HotelSessionUser`
type. Both systems store grants in the *same* `roles` / `permissions` / `role_permissions` tables —
those tables were already generic and hotel-scoped (`roles.hotel_id`), so no schema change was needed,
just a second set of module names.

- **hotel_admin**: bypasses the grant lookup entirely — full access within their own hotel (hotel_id
  scoping is what limits them, not role_permissions).
- **hotel_staff** (Reception / Department Manager / Department Staff): looked up via their
  `role_id`'s `role_permissions` row, exactly like Super Admin's `support_staff`. Each role's default
  grants are seeded once, at role-creation time, by `hotel-roles.service.ts`'s `getOrCreateHotelRole` —
  this is a *fixed* role model (the PRD specifies exactly what each of the three roles can do), not an
  editable permission matrix, so there's no grant-editing UI.
- **Department-Manager-to-own-department** and **Department-Staff-to-assigned-task** scoping is data
  scoping, not a view/create/edit/delete flag — enforced inline in `requests.service.ts`
  (`assertCanManageRequest` / `assertCanWorkRequest`) and `departments.service.ts`
  (`setDepartmentManager`), not by `hotel-rbac.ts`.

## Guest-facing scope (confirmed decision)

Per an explicit scoping decision made during planning, this module builds only the GM/Reception-facing
side. `guest_sessions` (the table + service + `/hotel/guest-sessions` list/terminate UI) exists and is
fully functional, but there is no guest-facing scan/PIN/request UI — Reception "issues" a session (a
check-in action) and guests are assumed to interact through a separate, not-yet-built surface. The
acceptance-test flows (see `build-phases.md` Phase 13) exercise request creation the way Reception
would if a guest called the desk instead of using an app — a real, PRD-sanctioned path (§18), not a
test-only shortcut.

## Reused patterns

- `Card`/`Button`/`Input`/`Select`/`Modal`/`StatusBadge`/`FormField`/`KpiCard`/`cn`/format helpers —
  `packages/ui`, ported from `apps/super-admin/src/components/ui/*` verbatim, then extended (Select,
  Textarea, FormField, KpiCard didn't exist yet).
- `recordAudit` / `requestIp` — reimplemented per-app (`src/server/audit.ts`) rather than shared,
  since audit is a thin wrapper with no cross-app state.
- The onboarding-wizard-as-checklist pattern (`onboarding_tracker` table +
  `v_hotel_onboarding_progress` view) — reused as-is; only the tracked step names changed (see
  `schema-changes.md`).
- PWA (`next-pwa`, `manifest.ts`, `InstallPrompt`) — added by the Department Staff module (PRD
  `RoomLink_V1_Department_Staff_PRD.pdf` §21), ported from `apps/super-admin` verbatim (same
  "cache the static app shell only, `NetworkOnly` on `/api/*`" policy — this app carries the same
  class of sensitive data). `apps/hotel-admin` had no PWA support at all before this; it now applies
  to the whole app, not just the Staff role, though Staff is the role PRD-required to use it. See
  `staff-implementation-plan.md` for the full module writeup, including the mobile-first
  `StaffBottomNav` — the app's first sub-`md` navigation surface for any role.
