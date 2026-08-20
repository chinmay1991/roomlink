-- Backs the hotel-admin mobile app's push notifications (Milestone 2 of the
-- mobile-app plan). Purely additive: one new table, no existing data touched.

-- CreateTable
CREATE TABLE "device_tokens" (
    "device_token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" VARCHAR(10) NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("device_token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_device_tokens_hotel_user" ON "device_tokens"("hotel_id", "user_id");

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
