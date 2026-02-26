-- AlterTable
ALTER TABLE "BusinessSettings"
ADD COLUMN "mailProviderType" TEXT,
ADD COLUMN "smtpHost" TEXT,
ADD COLUMN "smtpPort" INTEGER,
ADD COLUMN "smtpUsername" TEXT,
ADD COLUMN "smtpPasswordEncrypted" TEXT,
ADD COLUMN "smtpSecretRef" TEXT,
ADD COLUMN "mailFromName" TEXT,
ADD COLUMN "mailFromEmail" TEXT,
ADD COLUMN "mailReplyTo" TEXT,
ADD COLUMN "smtpUseTls" BOOLEAN DEFAULT false,
ADD COLUMN "smtpUseStarttls" BOOLEAN DEFAULT false;
