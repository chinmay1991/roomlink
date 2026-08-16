# Hotel Admin / GM — Navigation & Permissions

## Navigation tree

Matches PRD §22. Top-level sidebar items (`components/layout/sidebar.tsx`); items with sub-pages get
a tab strip (`components/layout/section-tabs.tsx`).

```
Dashboard              /hotel/dashboard
Onboarding             /hotel/onboarding
Hotel                  /hotel/profile  (tabs: Profile · Legal & GST · Departments · Rooms · QR Codes)
                        /hotel/legal
                        /hotel/departments
                        /hotel/rooms
                        /hotel/qr-codes
People                  /hotel/staff  (tabs: Staff · Department Managers · Reception)
                        /hotel/managers
                        /hotel/reception
Guest Services          /hotel/services  (tabs: Services · Requests · Restaurant Menu)
                        /hotel/requests
                        /hotel/menu
Operations               /hotel/activity  (tabs: Activity · Notifications · Guest Sessions)
                        /hotel/notifications
                        /hotel/guest-sessions
Subscription            /hotel/subscription   (read-only Plan & Usage — PRD scopes this to
                                                visibility only, no platform billing admin)
Settings                /hotel/settings
```

Department Manager (`roleName === 'Department Manager'`) gets its own five-item nav instead of the
above — see `department-manager-plan.md`. Department Staff (`roleName === 'Department Staff'`) gets
a four-item nav, both in the desktop `Sidebar` and as a mobile bottom tab bar
(`StaffBottomNav`, the app's first — no other role has a `< md` nav at all):

```
Home             /hotel/staff/home      today's tallies + a capped task preview
Tasks            /hotel/staff/tasks     the full, filterable department task board (cards, not a table)
Notifications    /hotel/notifications   same route as everyone else; branches to getStaffAlerts()
Profile          /hotel/staff/profile   read-only — name/employee ID/mobile/email/departments/status
```

"Profile" *is* a nav destination for this role (unlike Department Manager's, which relies on the
topbar) — it's this role's only account/sign-out surface, and PRD Rule 7 ("keep the Staff UI
simple") argues for one obvious place to find it rather than leaning on the topbar convention.

## Roles

| Role | user_type | Scope |
|---|---|---|
| Hotel Admin / GM | `hotel_admin` | Everything below, hotel-wide. Bypasses `role_permissions` entirely (`hotel-rbac.ts`) — the only thing that limits them is `hotel_id`. |
| Reception | `hotel_staff`, role "Reception" | Hotel-wide guest-service monitoring, communication, assign/reassign/escalate. No configuration authority (no departments/staff/menu/settings). |
| Department Manager | `hotel_staff`, role "Department Manager" | Their own managed department(s) only — enforced in `requests.service.ts`'s `assertCanManageRequest`, not by the coarse module grant. |
| Department Staff | `hotel_staff`, role "Department Staff" | Their assigned department(s) only (`user_departments`, PRD `RoomLink_V1_Department_Staff_PRD.pdf` Rule 2/3) — as of the Staff module, `hotel_requests`'s `view` is department-scoped in `resolveRequestScope`, not hotel-wide (a gap that predated the Staff module — see `staff-implementation-plan.md` §4). Can self-claim an unassigned request in their own department via `acceptRequest` (a new capability; previously only Reception/Hotel Admin/the department's own manager could assign work at all). Status changes on a claimed task still go through `assertCanWorkRequest` (`assigned_to === self`), unchanged. |

A user's role changes automatically, not by hand: assigning someone as a department's manager
(`setDepartmentManager`) promotes their `role_id` to "Department Manager"; removing them from every
department they managed reverts it to "Department Staff" (`demoteIfNoLongerManaging`). Reception is
never auto-assigned — it's its own creation flow (`/hotel/reception`).

## Module → role default grants

Seeded once per role, at first creation, by `hotel-roles.service.ts`'s `DEFAULT_GRANTS` — not an
editable matrix (the PRD's role model is fixed, not configurable per V1).

| `HOTEL_MODULES` entry | Reception | Dept. Manager | Dept. Staff |
|---|---|---|---|
| `hotel_dashboard` | view | view | view |
| `hotel_departments` | view | — | — |
| `hotel_rooms` | view | — | — |
| `hotel_staff` | view | view | — |
| `hotel_services` | — | view, edit | — |
| `hotel_requests` | view, create, edit | view, edit | view, edit |
| `hotel_guest_sessions` | view, create, edit | — | — |
| `hotel_notifications` | view | view | view |
| `hotel_managers` | — | — | — (assignment is Hotel Admin only, no role gets this) |
| `hotel_profile` / `hotel_qr_codes` / `hotel_menu` / `hotel_settings` | — | — | — (Hotel Admin only) |

hotel_admin implicitly has every module at every action level, hotel-wide.

## Where enforcement actually happens

Three layers, each catching what the layer above can't:

1. **`requireHotelSession`** — is there a valid session, and does it belong to a hotel at all?
   (401 if not).
2. **`requireCanHotel(user, module, action)`** — can this *role* reach this *screen/action* at all?
   (403 if not). This is the `HOTEL_MODULES` table above.
3. **Inline service-layer checks** — for anything the coarse module grant can't express: department
   ownership of a manager (`assertCanManageRequest`), *and* — since the Staff module —
   department membership of a Department Staff caller (`resolveRequestScope`'s Staff branch, backed
   by `user_departments` rather than `departments.manager_id`), applied uniformly to `listRequests`,
   `getRequestById`, and `getRequestHistory` so a request/its detail/its timeline are all exactly as
   department-scoped as each other. A staff member only touching their own assigned task
   (`assertCanWorkRequest`), self-claiming an unassigned one in their own department
   (`acceptRequest`, race-safe via a conditional update), and — found during Phase 13 testing, and
   again during the Staff module — every foreign id a client supplies (`roomId`, `departmentId`,
   `categoryId`, `assigneeId`) being proven to belong to the caller's `hotelId` before use (404/403
   if not; see `schema-changes.md`'s "Cross-tenant FK validation" and `staff-implementation-plan.md`
   §4/§8).

A request that fails any of the three layers never reaches a database write.
