-- CreateEnum
CREATE TYPE "TransactionalEmailLogStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "TransactionalEmailLog" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "bookingId" TEXT,
    "dedupeKey" TEXT,
    "status" "TransactionalEmailLogStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionalEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionalEmailLog_dedupeKey_status_idx" ON "TransactionalEmailLog"("dedupeKey", "status");

-- CreateIndex
CREATE INDEX "TransactionalEmailLog_createdAt_idx" ON "TransactionalEmailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TransactionalEmailLog" ADD CONSTRAINT "TransactionalEmailLog_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionalEmailLog" ADD CONSTRAINT "TransactionalEmailLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
