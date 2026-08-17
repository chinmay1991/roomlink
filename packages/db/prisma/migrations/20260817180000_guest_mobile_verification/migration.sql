-- Replace the Reception-issued PIN with Reception-activated mobile-number verification.

-- RenameColumn (preserve existing attempt-tracking data)
ALTER TABLE "guest_sessions" RENAME COLUMN "failed_pin_attempts" TO "failed_verification_attempts";
ALTER TABLE "guest_sessions" RENAME COLUMN "pin_locked_until" TO "verification_locked_until";

-- AlterTable (PIN hash retired; mobile number is the new credential)
ALTER TABLE "guest_sessions" DROP COLUMN "pin_hash";
ALTER TABLE "guest_sessions" ADD COLUMN     "guest_mobile_e164" VARCHAR(20);
