# Guest QR access: mobile-number verification

Supersedes the PIN-based sections of `docs/guest/guest-implementation-plan.md`, which document
the original (now retired) Reception-issued 6-digit PIN flow. That file is left as historical
record and hasn't been rewritten.

See `docs/guest/mobile-verification-security-gaps.md` for a threat-model review of this credential
swap — a mobile number is not a secret the way the retired PIN was, and that has real
consequences worth reading before relying on this as the only verification factor long-term.

## Flow

1. **Reception activates a stay** — in the Hotel Admin app's **Active Stays** screen
   (`/hotel/guest-sessions`), Reception picks the room, types the guest's mobile number, and
   clicks **Activate Stay**. This creates an active `guest_sessions` row bound to the hotel, the
   room, and the guest's normalized mobile number, with a start time and an expiry.
2. **Guest scans the room's QR** — unchanged from before: the QR encodes an opaque
   `code_value`, resolved server-side to a hotel + room. It never carries a raw internal ID and
   never authenticates by itself.
3. **Guest verifies their mobile number** — the guest types their number on the same screen the
   QR opened. The server normalizes it the same way Reception's input was normalized at
   activation, and compares it against the active stay's stored number for that exact hotel +
   room.
4. **Match → session; mismatch → generic denial.** On a match, a `guest_sessions.session_token`
   is set as an httpOnly cookie and the guest is redirected to `/home`. On a mismatch, the guest
   sees: *"This mobile number is not registered for the active stay in this room. Please contact
   Reception."* — the same message regardless of whether the number was simply wrong, malformed,
   or registered for a different room, so no response ever discloses which case occurred.

## Data model

`guest_sessions` (`packages/db/prisma/schema.prisma`):

| Column | Purpose |
|---|---|
| `guest_mobile_e164` | The stay's registered number, already normalized to E.164. `String?` at the DB level (old terminated rows predating this change carry `null`); every row created by `issueGuestSession` always sets it. |
| `failed_verification_attempts` | Wrong-mobile attempt counter for this stay (was `failed_pin_attempts`). |
| `verification_locked_until` | Lockout expiry after 5 failed attempts (was `pin_locked_until`). |
| `session_token` | The guest browser cookie's value. Rotated whenever Reception edits the mobile number. |

`pin_hash` is dropped entirely — no PIN exists anywhere in this flow anymore. Migration:
`packages/db/prisma/migrations/20260817180000_guest_mobile_verification/`.

**Why plaintext, not hashed:** the mobile number is PII Reception already knows (they typed it
in) and Reception needs to *see* it again in the Active Stays table — it isn't a secret
credential the way the old PIN was. "Never reveal it" applies specifically to the **guest-facing**
surface: it's enforced by never including it in any guest API response or error message, not by
hashing at rest.

**Why one normalized column, not raw + normalized:** both Reception's activation input and the
guest's verification input pass through the exact same `normalizePhone()` function before ever
being stored or compared. There is deliberately no "raw as typed" column to accidentally compare
against.

## Phone normalization

`apps/guest/src/server/phone.ts` and `apps/hotel-admin/src/server/phone.ts` (two small, identical
copies — mirrors this codebase's existing convention of duplicating small per-app utilities like
`audit.ts` rather than introducing a shared package):

```
normalizePhone(raw: string): string | null
```

- Strips whitespace, dashes, parentheses, dots.
- A leading `00` becomes `+`.
- **No `+` prefix → defaults to `+91` (India).** Reception is asked to type full E.164
  (`+919876543210`); a guest typing their own number on their own phone won't naturally include a
  country code, so the default fills that in. This pilot's hotels are all India-based — **if you
  expand outside India, this default needs to become configurable per hotel** rather than a fixed
  constant.
- Validates the result against `/^\+[1-9]\d{6,14}$/` (E.164 shape). Returns `null` on anything
  that doesn't resolve to a valid number.
- A `null` result is treated identically to a genuine mismatch on the guest-verification side —
  it never surfaces as a distinct validation error there, which would otherwise let an attacker
  distinguish "badly formatted" from "wrong number." On the Reception side (`issueGuestSession`,
  `updateGuestMobile`), a `null` result *does* throw a clear `InvalidPhoneError` (400) — Reception
  isn't an attacker, and a normal input-mistake error is the right UX there.

## API surface (`apps/hotel-admin`)

| Endpoint | Action | RBAC |
|---|---|---|
| `POST /api/v1/hotel/guest-sessions` | Activate a stay (`{ roomId, mobile, guestName?, hoursValid? }`) | `hotel_guest_sessions` / `create` |
| `POST /api/v1/hotel/guest-sessions/[sessionId]/mobile` | Edit the stay's mobile number (`{ mobile }`) | `hotel_guest_sessions` / `edit` |
| `POST /api/v1/hotel/guest-sessions/[sessionId]/terminate` | End the stay | `hotel_guest_sessions` / `edit` |
| `GET /api/v1/hotel/guest-sessions` | List all stays for the hotel | `hotel_guest_sessions` / `view` |

`hotel_admin` bypasses RBAC entirely (existing platform rule); staff roles need the listed
grants. RBAC only has four coarse actions (`view/create/edit/delete` — no finer sub-actions), so
editing the mobile number intentionally reuses the same `edit` grant as terminating.

`issueGuestSession` now also rejects activating a stay for a room whose `status` isn't `active`
(`InvalidTransitionError`, 409) — previously only the room dropdown filtered this client-side,
with no server-side guard.

## Security properties

- **QR alone never grants access** — unchanged. `resolveQrCode` only ever proves hotel + room;
  the verification step is mandatory and separate.
- **Room/hotel-specific matching** — the active stay looked up for comparison is the one for the
  *exact* resolved room; a correct number registered to a different room's stay is a mismatch
  (regression-tested).
- **Rate limiting** — DB-backed (not the in-memory `rate-limit.ts` used for staff login), because
  Vercel serverless instances are ephemeral/multi-instance. 5 wrong attempts locks verification
  for that stay for 15 minutes (`verification_locked_until`), even against the correct number.
- **Mobile-edit invalidates existing guest sessions** — `updateGuestMobile` rotates
  `session_token` to a fresh random value and clears the lockout counters. Any browser cookie
  issued under the old number stops resolving via `requireGuestSession` on its very next request.
- **Guest data scoping is unaffected and unchanged** — every guest-facing query
  (`requests`/`orders`/`conversations`/`notifications`) already filtered strictly by
  `guest_session_id: ctx.sessionId`, never by room or hotel alone; this was true before this
  change and is regression-tested (`requests.service.test.ts`).

## Known limitation: "room changed"

There's no dedicated "move guest to a different room" endpoint. The same guarantee — the old
session becomes immediately invalid — is already achieved today by **ending the stay on the old
room and activating a new one on the new room**: ending a stay sets `status: 'terminated'`, which
`requireGuestSession` checks on every request, so the old cookie stops working the moment that
happens. No new code was needed for this case; it falls out of the existing End Stay / Activate
Stay actions.

## Test coverage

| Ticket requirement | Test |
|---|---|
| Correct mobile + correct room grants access | `session.service.test.ts` — "returns the session on a correct, exactly-matching mobile number" |
| Incorrect mobile denied | `session.service.test.ts` — "rejects an incorrect mobile number and records the attempt" |
| Correct mobile for a different room denied | `session.service.test.ts` — "rejects the correct mobile number registered for a different room" |
| QR for inactive/revoked room denied | `session.service.test.ts` — "rejects a QR for an inactive room" / "rejects a deactivated (regenerated) QR" |
| Expired/ended stay denied | `session.service.test.ts` — "rejects an expired stay session" / "rejects a stay that expired since it was resolved" |
| Editing mobile invalidates previous access | `guest-sessions.service.test.ts` — "rotates the session token so any previously-issued browser cookie stops resolving" |
| Rate limiting after repeated failures | `session.service.test.ts` — "locks the session after the 5th consecutive wrong attempt" / "rejects even the correct mobile number while locked out" |
| Guest can access only their own room's requests/orders | `requests.service.test.ts` — scoping regression test |
| Activating a stay for an inactive room is blocked | `guest-sessions.service.test.ts` — "rejects activating a stay for a room that is not active" |
