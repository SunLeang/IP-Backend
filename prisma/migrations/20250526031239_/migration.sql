-- CreateIndex
CREATE INDEX "EventVolunteer_userId_eventId_status_idx" ON "EventVolunteer"("userId", "eventId", "status");
