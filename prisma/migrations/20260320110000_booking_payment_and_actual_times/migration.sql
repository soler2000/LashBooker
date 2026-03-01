-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "appointmentStartedAt" TIMESTAMP(3),
ADD COLUMN "appointmentFinishedAt" TIMESTAMP(3);
