-- call_logs.zego_room_id is the correlation key the guest and reception
-- clients share end to end: the guest generates it and Zego's own callID
-- (surfaced to the answering staff client via onIncomingCallReceived) is
-- set to the same value via sendCallInvitation's roomID param, since the
-- staff client only ever knows the Zego-side callID, never our internal
-- call_log_id. Enforcing uniqueness here matches that invariant explicitly.

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_zego_room_id_key" ON "call_logs"("zego_room_id");
