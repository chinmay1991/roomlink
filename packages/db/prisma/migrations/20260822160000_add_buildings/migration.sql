-- Supports hotels with multiple buildings: a hotel-scoped `buildings` list
-- (find-or-create by name, same pattern as room_types) that a room can
-- optionally belong to. Rooms with no building_id fall back to displaying
-- the hotel's own name in the UI — that fallback is display-time only, not
-- stored here. Purely additive.

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "building_id" UUID;

-- CreateTable
CREATE TABLE "buildings" (
    "building_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("building_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buildings_hotel_id_name_key" ON "buildings"("hotel_id", "name");

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("hotel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("building_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
