-- AlterTable
ALTER TABLE "EventAttendance" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "registeredBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;
