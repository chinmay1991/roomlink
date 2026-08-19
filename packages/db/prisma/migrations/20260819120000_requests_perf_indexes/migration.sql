-- Add indexes for `requests` filter combinations hit on nearly every hotel-admin page
-- (Dashboard, Requests, Reception Dashboard, Department Monitoring, Manager Queue, Staff
-- Home/Tasks, Alerts) that weren't covered by the existing idx_requests_hotel_status index.

-- CreateIndex
CREATE INDEX "idx_requests_hotel_department_status" ON "requests"("hotel_id", "department_id", "status");

-- CreateIndex
CREATE INDEX "idx_requests_assigned_status" ON "requests"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "idx_requests_hotel_created_at" ON "requests"("hotel_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_requests_hotel_status_completed_at" ON "requests"("hotel_id", "status", "completed_at");
