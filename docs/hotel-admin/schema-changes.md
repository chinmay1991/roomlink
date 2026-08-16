# Hotel Admin / GM — Schema Changes

All changes live in `packages/db/prisma/schema.prisma` and were applied to `rmdb` via two migrations:
`packages/db/prisma/migrations/20260816160000_hotel_admin_module` (the bulk of it) and
`20260816170000_departments_enabled_employee_id` (a follow-up — see below for why). Everything is
additive: new nullable columns, new tables, new enum values. Nothing existing was renamed, dropped,
or made non-nullable, and no existing row lost data.

This doubles as the contradiction log required by the project's development rules — each row is a
place where the PRD asked for something the existing schema/app didn't have, with the resolution
taken.

## Contradictions found → resolutions

| PRD requirement | Existing state | Resolution |
|---|---|---|
| Hotel Admin/GM must log in and self-serve | `apps/super-admin`'s auth hard-blocks `hotel_admin`/`hotel_staff` | Separate app (`apps/hotel-admin`) with its own auth, not a shared login. |
| Backend must reject cross-hotel access even if the client sends a foreign id | No `hotel_id` on the session at all | `hotelId` added to JWT/session, sourced only from `users.hotel_id` at login. |
| 4 distinct hotel-side role behaviors | `rbac.ts` only understood `super_admin`/`support_staff` | Parallel `hotel-rbac.ts` + its own `HOTEL_MODULES`, reusing the existing generic `roles`/`permissions`/`role_permissions` tables. |
| Every department may have one manager or none | Only the generic `user_departments` many-to-many existed | `departments.manager_id UUID?` → FK `users`. |
| Department enable/disable, preserving history | **No `is_enabled` column existed at all** — found while building Phase 3, not during planning | `departments.is_enabled BOOLEAN DEFAULT true` (follow-up migration). |
| Staff field "Employee ID" | `users` had no such column — same discovery, Phase 4 | `users.employee_id VARCHAR(50)?` (follow-up migration). |
| Legal business name, GSTIN, PAN, billing address/email, description, website, breakfast/restaurant timing | None of these existed on `hotels` | Additive nullable columns on `hotels`. GSTIN/PAN format-validated at the Zod layer, not the DB. |
| Welcome message, guest instructions, Wi-Fi details, notification prefs | No storage at all | New 1:1 `hotel_settings` table. |
| Static QR + PIN → temporary guest session; old QR photo must not grant access after checkout | Only a lightweight `guests` table (name/phone/dates), no session/PIN/expiry model | New `guest_sessions` table: opaque `session_token`, `pin_hash`, `expires_at`, `status` enum, `terminated_by`/`terminated_at`. Enforced: issuing a new session for a room terminates any existing active one first. |
| NEW→ASSIGNED→IN_PROGRESS→COMPLETED (+optional CANCELLED/ESCALATED); priority filter; internal notes; auditability | `request_status` = `pending, in_progress, completed, cancelled` only; no priority; no history | Added `assigned`/`escalated` to the enum; new `request_priority` enum (`normal/high/urgent`) on `requests.priority`; `requests.notes text`; new `request_status_history` table capturing both status changes and reassignments (`to_assignee`) in one place instead of a second near-duplicate `request_assignments` table. |
| Menu item description, veg/non-veg, availability distinct from enable/disable | `menu_items` had none of these | `description text?`, `is_veg boolean?`, `is_available boolean default true` (alongside the existing `status` enum for admin enable/disable). |
| QR lifecycle: generated → downloaded/printed → installed → active | `qr_codes` had `is_active` only | `installed_at timestamptz?`. "Downloaded/printed" stays an audit-log event, not stored state. |
| 12-step GM onboarding wizard | Super Admin's hotel-creation seeded a 9-step list with different names | `ONBOARDING_STEPS` in `apps/super-admin/src/server/services/hotels.service.ts` extended to the 11 tracked steps (Go Live is a terminal action, not a tracker row) — the only Super Admin file touched, and only because it's the single place that seeds the very rows this module's onboarding page reads. |

## Full DDL summary

```
hotels            + description, website, breakfast_time, restaurant_time,
                     legal_business_name, gstin, pan, billing_address_line,
                     billing_city, billing_state, billing_pincode,
                     billing_country, billing_email
departments       + manager_id (FK users), is_enabled (default true)
users             + employee_id
qr_codes          + installed_at
menu_items        + description, is_veg, is_available (default true)
requests          + priority (new enum request_priority), notes
request_status    + assigned, escalated (enum values added)

NEW TABLE  request_status_history  (request_id, from_status, to_status,
                                     to_assignee, changed_by, changed_at, note)
NEW TABLE  guest_sessions          (hotel_id, room_id, guest_id?, session_token,
                                     pin_hash, issued_at, expires_at, status,
                                     terminated_by?, terminated_at?)
NEW TABLE  hotel_settings          (hotel_id 1:1, welcome_message,
                                     guest_instructions, wifi_name,
                                     wifi_password, notify_* booleans)
NEW ENUM   request_priority        (normal, high, urgent)
NEW ENUM   guest_session_status    (active, expired, terminated)
```

## Cross-tenant FK validation (found during Phase 13 testing, fixed immediately)

Scoping a record's own `hotel_id` correctly is necessary but not sufficient — a route can create a
row correctly scoped to the caller's hotel while still pointing a foreign key at *another* hotel's
row, if that id is client-supplied and never checked. Testing the two pilot hotels against each other
caught exactly this: a Hotel A session could `POST /api/v1/hotel/requests` with Hotel B's `roomId`
and `departmentId` and get a 201, silently creating a request whose FKs pointed cross-tenant.

Fixed by adding an explicit "does this id belong to `hotelId`?" check before use, in every service
function that accepts a foreign id referencing another hotel-scoped table:

- `requests.service.ts` — `createRequest` (roomId, departmentId), `assignRequest` (assigneeId)
- `staff.service.ts` — `createStaff` and `setStaffDepartments` (departmentIds)
- `guest-services.service.ts` — `createService`/`updateService` (departmentId)
- `menu.service.ts` — `createMenuItem`/`updateMenuItem` (categoryId)

Functions that already validated correctly and needed no change: `qr-codes.service.ts` (room lookup
already hotel-scoped), `guest-sessions.service.ts` (same), `departments.service.ts`'s
`setDepartmentManager` (candidate user already looked up with `hotel_id` in the `where`), and
`rooms.service.ts` (room type is get-or-created by name within `hotelId`, never accepts a raw id).

Verified by re-running the same cross-tenant probes after the fix (see `build-phases.md` Phase 13) —
all four now return 404/403, and legitimate same-hotel requests are unaffected.
