-- AlterEnum
ALTER TYPE "actor_type" ADD VALUE 'guest';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "guest_session_id" UUID;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guest_session_id" UUID;

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "guest_session_id" UUID;

-- CreateIndex
CREATE INDEX "idx_conversations_guest_session" ON "conversations"("guest_session_id");

-- CreateIndex
CREATE INDEX "idx_orders_guest_session" ON "orders"("guest_session_id");

-- CreateIndex
CREATE INDEX "idx_requests_guest_session" ON "requests"("guest_session_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("session_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("session_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("session_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
