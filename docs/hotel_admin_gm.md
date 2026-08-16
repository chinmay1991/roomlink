PROJECT: ROOMLINK
MODULE: HOTEL ADMIN / GM
VERSION: V1.0
STATUS: DEVELOPMENT

You are developing the Hotel Admin / General Manager module of RoomLink.

IMPORTANT:
The RoomLink Super Admin module has already been designed/completed.

DO NOT redesign, modify, or rebuild the Super Admin module unless explicitly requested.

Your responsibility in this phase is ONLY the Hotel Admin / GM module.

The Hotel Admin is responsible for onboarding, configuring and operating ONE hotel inside RoomLink.

==================================================
1. PRODUCT CONTEXT
==================================================

RoomLink is a hotel guest-service SaaS platform.

The core concept is:

Guest
→ Scan Room QR
→ Enter guest verification/PIN
→ Access RoomLink
→ Request service / contact Reception / order food
→ Reception monitors request
→ Request reaches appropriate department
→ Staff completes request
→ Guest receives update

RoomLink is NOT intended to be a full hotel PMS or ERP in V1.

The V1 objective is to provide a digital communication and service-request layer between hotel guests and hotel staff.

==================================================
2. CURRENT PRODUCT ARCHITECTURE
==================================================

The system has these users:

1. Super Admin
2. Hotel Admin / GM
3. Reception
4. Department Manager - OPTIONAL
5. Department Staff
6. Guest

Super Admin is outside the scope of this development phase.

You are implementing:

HOTEL ADMIN / GM

==================================================
3. HOTEL ADMIN SCOPE
==================================================

Hotel Admin has access to ONE hotel only.

Hotel Admin must NOT be able to:

- View other hotels
- Create other hotels
- Access Super Admin functions
- Manage RoomLink platform settings
- Manage RoomLink subscriptions globally
- Access another hotel's data
- Access platform-wide analytics

Hotel Admin can manage all configuration and operational setup for their own hotel.

==================================================
4. TWO PILOT HOTEL MODELS
==================================================

The architecture MUST support both of these hotels without separate codebases.

PILOT A:

110-room hotel

- Multiple departments
- Department Managers exist
- Department Staff exist
- Reception exists

Example:

Housekeeping
→ Housekeeping Manager
→ Housekeeping Staff

Restaurant
→ Restaurant Manager
→ Restaurant Staff

Maintenance
→ Maintenance Manager
→ Maintenance Staff


PILOT B:

15-room hotel

- No Department Managers
- Reception exists
- Staff perform cross-department activities

Example:

Raju
→ Housekeeping
→ Restaurant
→ Maintenance

Therefore:

DEPARTMENT MANAGER IS OPTIONAL.

STAFF CAN BELONG TO MULTIPLE DEPARTMENTS.

Do NOT implement a one-staff-to-one-department relationship.

The relationship is:

Staff ↔️ Departments = MANY TO MANY

==================================================
5. DEPARTMENT MODEL
==================================================

Departments are configurable per hotel.

RoomLink provides default department templates such as:

- Reception
- Housekeeping
- Restaurant
- Maintenance
- Room Service
- Laundry
- Spa & Wellness
- Concierge / Transport

A hotel does NOT need to activate every department.

Hotel Admin can:

- Enable department
- Disable department
- Rename department
- Create custom department if supported
- Assign staff
- Assign optional manager
- Configure department services

Example:

15-room hotel:

Reception ✓
Housekeeping ✓
Restaurant ✓
Maintenance ✓
Laundry ✕
Spa ✕
Transport ✕

110-room hotel may enable more departments.

==================================================
6. DEPARTMENT MANAGER
==================================================

Department Manager is OPTIONAL.

Every department must allow:

Manager assigned
OR
No manager

Example:

Housekeeping
Manager: Anita
Staff: 10

OR

Housekeeping
Manager: None
Staff: 3

If no manager exists:

Hotel Admin / GM manages the department.

Do NOT force every department to have a manager.

==================================================
7. STAFF MODEL
==================================================

A staff member can belong to one OR multiple departments.

Example:

Raju:

Housekeeping ✓
Restaurant ✓
Maintenance ✓

This must be implemented using a many-to-many relationship.

Recommended model:

staff
staff_departments
departments

NOT:

staff.department_id

For V1, department membership determines which department tasks the staff member can receive.

Do not build advanced skill/certification routing in V1.

==================================================
8. HOTEL ONBOARDING
==================================================

The Hotel Admin receives an invitation from the Super Admin.

After login, the Hotel Admin should be guided through an onboarding wizard.

Recommended flow:

STEP 1
Hotel Profile

STEP 2
Legal / GST Information

STEP 3
Departments

STEP 4
Rooms

STEP 5
QR Codes

STEP 6
Staff

STEP 7
Department Managers

STEP 8
Guest Services

STEP 9
Restaurant Menu

STEP 10
Notifications / Settings

STEP 11
Review

STEP 12
Go Live

The Hotel Admin should be able to save progress and continue later.

==================================================
9. HOTEL PROFILE
==================================================

Hotel Admin can configure:

Hotel Name
Brand Name
Hotel Logo
Hotel Description
Address
City
State
Pincode
Country
Phone
Email
Website
Timezone
Check-in Time
Check-out Time
Breakfast Timing
Restaurant Timing

==================================================
10. LEGAL / GST INFORMATION
==================================================

The Hotel master must support India-first hotel information.

Fields:

Legal Business Name
GSTIN
PAN
Billing Address
City
State
Pincode
Country

GSTIN should support format validation.

Do not make GST mandatory during the first screen of hotel onboarding.

It should be completed before billing/invoice generation where applicable.

==================================================
11. ROOM MANAGEMENT
==================================================

Hotel Admin can:

Create room
Edit room
Deactivate room
Reactivate room
Search rooms
Filter rooms
Bulk import rooms

Room fields:

Room Number
Floor
Room Type
Room Status

Support Excel/CSV bulk import.

Example:

101 | Floor 1 | Deluxe
102 | Floor 1 | Deluxe
201 | Floor 2 | Premium

==================================================
12. QR CODE MANAGEMENT
==================================================

Every active room has a RoomLink QR.

QR identifies:

Hotel + Room

IMPORTANT SECURITY RULE:

The QR itself MUST NOT authenticate the guest.

Guest authentication/session must be separate.

Guest flow:

Scan QR
→ Identify hotel and room
→ Guest verification/PIN
→ Create temporary Guest Session
→ Access RoomLink

After checkout:

Guest Session is revoked/expired.

An old photograph of the QR must NOT provide access to the previous guest session.

Hotel Admin can:

Generate QR
Download QR
Regenerate QR
Print QR
Mark QR Installed
Deactivate QR

==================================================
13. STAFF MANAGEMENT
==================================================

Hotel Admin can:

Create Staff
Edit Staff
Activate Staff
Deactivate Staff
Reset access
Assign departments
Remove department assignment

Staff fields:

Name
Employee ID
Mobile
Email
Status

Department assignment must support multiple departments.

==================================================
14. DEPARTMENT MANAGER MANAGEMENT
==================================================

Hotel Admin can:

Assign Manager
Change Manager
Remove Manager
Deactivate Manager

Manager scope is ONLY their assigned department.

A Department Manager cannot manage another department unless explicitly assigned.

==================================================
15. GUEST SERVICES
==================================================

Hotel Admin configures services available to guests.

HOUSEKEEPING:

Extra Towels
Water
Toiletries
Pillow
Blanket
Room Cleaning

MAINTENANCE:

AC Issue
TV Issue
Wi-Fi Issue
Plumbing
Electricity
Other

RESTAURANT:

Food ordering

Hotel Admin should be able to:

Create service
Edit service
Enable service
Disable service
Set service name
Set department
Set availability

==================================================
16. RESTAURANT MENU
==================================================

V1 supports basic restaurant ordering.

Hotel Admin can:

Create category
Create menu item
Edit menu item
Change price
Enable/disable item
Set availability
Upload image

Example categories:

Breakfast
Starters
Main Course
Beverages
Desserts

Do NOT build a full restaurant POS in V1.

==================================================
17. REQUEST MONITORING
==================================================

Hotel Admin can see all guest requests for their hotel.

Example:

Room 204
Extra Towels
Housekeeping
Pending

Room 315
AC Issue
Maintenance
In Progress

Room 112
Chicken Biryani
Restaurant
Preparing

Filters:

Department
Status
Priority
Room
Date

Request states:

NEW
ASSIGNED
IN_PROGRESS
COMPLETED

Optional:

CANCELLED
ESCALATED

==================================================
18. RECEPTION
==================================================

Reception is a special operational role.

Reception has HOTEL-WIDE visibility for guest requests.

Reception can:

View all guest requests
View all departments
Communicate with guests
Assign requests
Reassign requests
Escalate requests
Monitor completion
Add internal notes

Reception cannot:

Manage staff
Create departments
Change hotel configuration
Change restaurant menu
Manage subscription

Hotel Admin can see everything Reception sees.

==================================================
19. REQUEST ROUTING
==================================================

If a Department Manager exists:

Guest
→ Reception
→ Department Manager
→ Staff

If no Department Manager exists:

Guest
→ Reception
→ Staff

If a staff member belongs to multiple departments, they can receive eligible tasks from those departments.

Example:

Raju:
Housekeeping
Restaurant
Maintenance

Guest requests:

AC repair

Department:
Maintenance

Eligible staff:
Raju

Raju receives the task.

==================================================
20. NOTIFICATIONS
==================================================

Hotel Admin should receive important operational notifications:

New critical request
Unassigned request
Delayed request
SLA breach
Critical maintenance issue
Important guest message

V1 notification channels:

In-app
Push notification

Do not overbuild notification infrastructure in V1.

==================================================
21. HOTEL ADMIN DASHBOARD
==================================================

Dashboard should display:

Today's Requests
Pending Requests
In Progress
Completed
Active Rooms
Active Staff
Departments
Unread Guest Messages

Department summary:

Reception
Housekeeping
Restaurant
Maintenance
etc.

Display:

Pending
In Progress
Completed

Alerts:

Unassigned requests
Delayed requests
Staff unavailable
Restaurant item unavailable
QR not activated
Important guest messages

==================================================
22. HOTEL ADMIN NAVIGATION
==================================================

Recommended navigation:

Dashboard

Hotel
  - Hotel Profile
  - Departments
  - Rooms
  - QR Codes

People
  - Staff
  - Department Managers

Guest Services
  - Services
  - Requests
  - Restaurant Menu

Operations
  - Activity
  - Notifications

Subscription
  - Plan & Usage

Settings

Keep navigation simple and responsive.

==================================================
23. HOTEL ADMIN PERMISSIONS
==================================================

Hotel Admin has hotel-wide permissions.

Can:

Manage hotel profile
Manage legal/GST information
Manage departments
Manage rooms
Manage QR codes
Manage staff
Manage department managers
Manage services
Manage restaurant menu
View all requests
View guest session status
View hotel activity
Manage hotel settings

Cannot:

Manage another hotel
Manage Super Admin
Manage platform users
Modify RoomLink platform settings
View other hotels
Modify global subscription configuration

==================================================
24. DATABASE REQUIREMENTS
==================================================

Use the existing RoomLink PostgreSQL architecture.

Do NOT create a second unrelated database.

Important entities include:

hotels
hotel_admins
departments
hotel_departments
users
staff
staff_departments
rooms
qr_codes
stays
guest_sessions
requests
request_assignments
request_status_history
conversations
messages
menu_categories
menu_items
orders
order_items
notifications
subscriptions
invoices
audit_logs

The Hotel Admin module must always be tenant-aware.

Every hotel-owned record must be associated with hotel_id directly or through a validated relationship.

Never allow Hotel Admin APIs to access records belonging to another hotel.

==================================================
25. MULTI-TENANT SECURITY
==================================================

THIS IS CRITICAL.

The frontend must NOT be trusted for tenant isolation.

Every backend request must determine:

authenticated user
→ hotel_id
→ allowed resource
→ permission

Example:

Hotel Admin of Hotel A requests:

GET /api/hotels/B/rooms

The backend MUST reject the request.

Do not rely only on frontend route restrictions.

==================================================
26. UX REQUIREMENTS
==================================================

Use the RoomLink design system.

UI should be:

Clean
Modern
Professional
Responsive
Mobile-friendly
PWA-compatible

Forms should have:

Validation
Loading states
Success states
Error states
Empty states
Confirmation dialogs for destructive actions

Use reusable components.

Do not create separate UI implementations for similar screens.

==================================================
27. ONBOARDING UX
==================================================

Show progress:

Hotel Profile ✓
Legal/GST ✓
Departments ✓
Rooms ✓
QR Codes ✓
Staff ✓
Managers ✓
Services ✓
Restaurant ✓
Testing ✓
Go Live ✓

Hotel Admin can:

Save and continue later
Go back
Edit previous sections
See incomplete steps
See completion percentage

Do not force completion of optional sections unnecessarily.

==================================================
28. V1 NON-GOALS
==================================================

DO NOT IMPLEMENT:

Full PMS
Reservation system
Full check-in/check-out
Payroll
Inventory management
Accounting system
Loyalty program
Advanced CRM
Revenue management
AI chatbot
Advanced PMS integrations
Complex billing
Full restaurant POS

These are future phases.

==================================================
29. ACCEPTANCE TEST — 110 ROOM HOTEL
==================================================

Create hotel:

110 rooms

Departments:

Reception
Housekeeping
Restaurant
Maintenance

Managers:

Housekeeping Manager
Restaurant Manager
Maintenance Manager

Staff assigned to departments.

Test:

Guest
→ QR
→ Verification
→ Request extra towels
→ Reception
→ Housekeeping Manager
→ Housekeeping Staff
→ Complete
→ Guest notified

All steps must work.

==================================================
30. ACCEPTANCE TEST — 15 ROOM HOTEL
==================================================

Create hotel:

15 rooms

Departments:

Reception
Housekeeping
Restaurant
Maintenance

No Department Managers.

Staff:

Raju
→ Housekeeping
→ Restaurant
→ Maintenance

Test:

Guest
→ QR
→ Verification
→ Request AC repair
→ Reception
→ Maintenance
→ Raju
→ Complete
→ Guest notified

Test another request:

Guest
→ Restaurant
→ Raju
→ Complete

The same staff account must be able to handle tasks from multiple departments.

==================================================
31. DEVELOPMENT RULES
==================================================

Before coding:

1. Read the supplied RoomLink Hotel Admin PRD.
2. Read the existing database schema.
3. Read the existing Super Admin implementation.
4. Understand existing routes/components/database relationships.
5. Do not duplicate existing functionality.
6. Do not modify Super Admin unless required for integration.
7. Identify missing database relationships before coding.
8. Produce an implementation plan first.

During coding:

1. Use TypeScript.
2. Use reusable React components.
3. Use server-side authorization.
4. Validate API inputs.
5. Enforce tenant isolation.
6. Use database transactions for multi-table operations.
7. Use migrations for schema changes.
8. Do not silently change existing database structures.
9. Maintain auditability for sensitive actions.
10. Write tests for critical workflows.

==================================================
32. DEVELOPMENT ORDER
==================================================

Build in this order:

PHASE 1
Hotel Admin authentication/session

PHASE 2
Hotel Profile

PHASE 3
Departments

PHASE 4
Staff + multi-department assignment

PHASE 5
Optional Department Manager

PHASE 6
Rooms

PHASE 7
QR Codes

PHASE 8
Guest Services

PHASE 9
Restaurant Menu

PHASE 10
Requests

PHASE 11
Notifications

PHASE 12
Dashboard

PHASE 13
Testing

PHASE 14
Production readiness

==================================================
33. IMPORTANT IMPLEMENTATION RULE
==================================================

Do not assume that the PRD is the only source of truth.

Use:

PRD
+
Existing database schema
+
Existing Super Admin code
+
Existing UX/design system

as the combined RoomLink architecture.

If you find a contradiction:

STOP.

Explain:

1. Existing implementation
2. PRD requirement
3. Conflict
4. Recommended solution

Do not silently choose one.

==================================================
34. DEFINITION OF DONE
==================================================

The Hotel Admin module is considered complete only when a Hotel Admin can:

✓ Login
✓ Access only their hotel
✓ Complete hotel onboarding
✓ Enter legal/GST information
✓ Configure departments
✓ Create optional Department Managers
✓ Create staff
✓ Assign one staff member to multiple departments
✓ Create/import rooms
✓ Generate room QR codes
✓ Configure guest services
✓ Configure restaurant menu
✓ View hotel requests
✓ View guest sessions
✓ View operational activity
✓ Receive notifications
✓ Manage hotel settings

AND both pilot scenarios work:

110-room hotel WITH Department Managers

15-room hotel WITHOUT Department Managers and WITH multi-department staff.

Do not mark the module complete until both scenarios pass end-to-end testing.