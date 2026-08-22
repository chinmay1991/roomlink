-- Backs the guest-to-reception voice calling feature (ZegoCloud). Tracks
-- each call attempt for history/missed-call visibility on the Reception
-- dashboard. Purely additive: one new enum, one new table, no existing data
-- touched.

-- CreateEnum
CREATE TYPE "call_status" AS ENUM ('ringing', 'answered', 'missed', 'declined', 'ended');

-- CreateTable
CREATE TABLE "call_logs" (
    "call_log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "room_id" UUID,
    "guest_session_id" UUID,
    "zego_room_id" VARCHAR(255) NOT NULL,
    "status" "call_status" NOT NULL DEFAULT 'ringing',
    "answered_by" UUID,
    "initiated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("call_log_id")
);

-- CreateIndex
CREATE INDEX "idx_call_logs_hotel_initiated_at" ON "call_logs"("hotel_id", "initiated_at");

-- CreateIndex
CREATE INDEX "idx_call_logs_guest_session" ON "call_logs"("guest_session_id");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("session_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
