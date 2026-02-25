-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "BusinessSettings"
ADD COLUMN "pendingPaymentExpiryMinutes" INTEGER NOT NULL DEFAULT 30;
