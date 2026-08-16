-- CreateEnum
CREATE TYPE "guest_session_status" AS ENUM ('active', 'expired', 'terminated');

-- CreateEnum
CREATE TYPE "request_priority" AS ENUM ('normal', 'high', 'urgent');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "request_status" ADD VALUE 'assigned';
ALTER TYPE "request_status" ADD VALUE 'escalated';

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "manager_id" UUID;

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "billing_address_line" VARCHAR(255),
ADD COLUMN     "billing_city" VARCHAR(100),
ADD COLUMN     "billing_country" VARCHAR(100),
ADD COLUMN     "billing_email" VARCHAR(150),
ADD COLUMN     "billing_pincode" VARCHAR(20),
ADD COLUMN     "billing_state" VARCHAR(100),
ADD COLUMN     "breakfast_time" TIME(6),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "gstin" VARCHAR(15),
ADD COLUMN     "legal_business_name" VARCHAR(200),
ADD COLUMN     "pan" VARCHAR(10),
ADD COLUMN     "restaurant_time" TIME(6),
ADD COLUMN     "website" VARCHAR(255);

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_veg" BOOLEAN;

-- AlterTable
ALTER TABLE "qr_codes" ADD COLUMN     "installed_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" "request_priority" NOT NULL DEFAULT 'normal';

-- CreateTable
CREATE TABLE "guest_sessions" (
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "guest_id" UUID,
    "session_token" VARCHAR(255) NOT NULL,
    "pin_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "guest_session_status" NOT NULL DEFAULT 'active',
    "terminated_by" UUID,
    "terminated_at" TIMESTAMPTZ(6),

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "hotel_settings" (
    "hotel_id" UUID NOT NULL,
    "welcome_message" TEXT,
    "guest_instructions" TEXT,
    "wifi_name" VARCHAR(100),
    "wifi_password" VARCHAR(100),
    "notify_critical_requests" BOOLEAN NOT NULL DEFAULT true,
    "notify_unassigned" BOOLEAN NOT NULL DEFAULT true,
    "notify_guest_messages" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_settings_pkey" PRIMARY KEY ("hotel_id")
);

-- CreateTable
CREATE TABLE "request_status_history" (
    "history_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "from_status" "request_status",
    "to_status" "request_status",
    "to_assignee" UUID,
    "changed_by" UUID,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "request_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_session_token_key" ON "guest_sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_guest_sessions_hotel_room" ON "guest_sessions"("hotel_id", "room_id");

-- CreateIndex
CREATE INDEX "idx_request_status_history_request" ON "request_status_history"("request_id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("guest_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_terminated_by_fkey" FOREIGN KEY ("terminated_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_settings" ADD CONSTRAINT "hotel_settings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("request_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_to_assignee_fkey" FOREIGN KEY ("to_assignee") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

