-- CreateIndex
CREATE INDEX "EventAttendance_eventId_status_idx" ON "EventAttendance"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventVolunteer_eventId_status_idx" ON "EventVolunteer"("eventId", "status");
