# Security analysis: mobile-number verification vs. the retired PIN

Companion to `docs/guest/mobile-verification-flow.md` (which documents the flow itself). This
file is a threat-model review of the credential swap made there — Reception-issued 6-digit PIN
replaced with the guest's own mobile number — written because the mobile number, unlike the PIN,
is not actually a secret, and that has real consequences worth tracking deliberately rather than
losing in a chat thread.

## The core gap: knowledge-based, not possession-based

The product ticket for this change explicitly deferred SMS/voice OTP to a later phase, so this
flow only ever verifies that someone *knows* the registered number — never that they *possess*
the phone it belongs to. That's a meaningful downgrade from the PIN model:

- The PIN was randomly generated per stay (`packages/db/prisma/migrations/...` — see the retired
  `pin_hash` column) and known only to Reception and the guest they handed it to.
- A mobile number is routinely discoverable by people who are not the guest: a booking
  confirmation email, a WhatsApp thread with the hotel, a business card, a travel companion, a
  family member, a driver, or even a partial glimpse of a phone screen.
- **A targeted attacker's first guess succeeds immediately.** If someone already knows (or can
  find) a specific guest's number, they get in on attempt #1 — the rate limiter
  (`MAX_VERIFICATION_ATTEMPTS = 5`, `apps/guest/src/server/services/session.service.ts`) does
  nothing against a single informed guess; it only throttles blind/automated guessing. A random
  6-digit PIN gave even a targeted attacker roughly a 1-in-a-million shot per try — the mobile
  number gives them nothing to guess if they already know it.
- **Numbers are structurally guessable at scale.** Indian mobile numbers follow known patterns
  (start with 6–9, 10 digits, often clustered by circle/operator). Someone who overheard or
  partially saw a number has a far smaller effective search space than a uniform 6-digit PIN ever
  offered.

## Secondary gaps introduced by this change

1. **No cryptographic protection at rest.** The PIN was bcrypt-hashed (`pin_hash`); the mobile
   number is stored as plaintext, normalized E.164 (`guest_mobile_e164`) — a deliberate trade-off
   because Reception needs to view and edit it in the Active Stays screen. A database leak (or a
   bug in a staff-facing endpoint) now directly exposes real guest phone numbers tied to specific
   rooms and dates. Leaking bcrypt PIN hashes exposed nothing usable; leaking phone numbers
   exposes real PII.
2. **No retention/purge policy.** Nothing currently clears `guest_mobile_e164` when a stay ends
   or expires — terminated `guest_sessions` rows keep the guest's real number indefinitely. PINs
   were throwaway by construction; phone numbers are long-lived personal identifiers that now
   accumulate in the database with no expiry.
3. **Rate limiting is per-room, not global.** The 5-attempts/15-minute lockout
   (`verification_locked_until`) is scoped to one active stay. An attacker guessing across many
   rooms in the same hotel gets 5 free tries *per room*, with no hotel-wide or per-IP throttle.
   This mattered less for random PINs (there was no pattern to exploit across rooms) but matters
   more here, since real numbers can be pattern-guessed and the attempt budget resets per room.
4. **Broader social-engineering surface.** "Can you confirm your mobile number for
   verification?" is a plausible phishing pretext that's difficult to distinguish from a
   legitimate front-desk or booking-platform question. The old PIN only ever came from one
   trusted source (Reception, once, at check-in), so there was no equivalent cover story for
   tricking a guest into revealing it.
5. **SIM-swap / secondhand-number blind spot.** Because there's no possession check, the flow
   can't distinguish the actual current owner of a number from anyone who happens to know the
   digits — including a previous owner of a reassigned number, or someone reading it off a
   business card long after it changed hands.

## What's still solid (unchanged from the PIN design)

- **QR alone never grants access** — both a room-specific QR and the credential are still
  required; this core rule from the original ticket is untouched.
- **Blind/automated brute-force is still blocked** by the same DB-backed rate limiter used for
  PINs, now keyed to wrong-mobile attempts instead of wrong-PIN attempts.
- **No oracle in error responses** — a wrong number, a malformed number, and a number registered
  to a different room all return the identical generic message
  (`MobileMismatchError` in `apps/guest/src/server/errors.ts`).
- **Session-token rotation on edit** — `updateGuestMobile` in
  `apps/hotel-admin/src/server/services/guest-sessions.service.ts` still instantly invalidates
  any already-issued guest cookie the moment Reception changes the number.
- **Cross-room/cross-hotel isolation** is unaffected — every lookup is still scoped by the exact
  hotel + room resolved server-side from the QR's opaque token, never client-asserted.

## Possible mitigations, roughly cheapest first

| Mitigation | Effort | What it buys |
|---|---|---|
| Null out `guest_mobile_e164` when a stay is terminated/expires (or purge after N days) | Low | Shrinks breach blast radius — closes gap #2 |
| Global or per-IP throttling in addition to per-room lockout | Low–Medium | Blunts distributed guessing across many rooms — closes gap #3 |
| Hybrid credential: mobile number **+** a short Reception-issued code | Medium | Reintroduces an actual secret without building full OTP infrastructure — meaningfully closes the core gap |
| SMS/voice OTP (already anticipated by the original ticket as a future optional method) | High | The real fix — proves *possession*, not just knowledge; closes the core gap directly |

None of these are implemented as of this document. This is a review of the trade-off made when
the PIN was replaced, not a to-do list committed to — treat it as input for a decision on
whether/when to close these gaps.
