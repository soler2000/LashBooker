-- Add immutable service snapshot fields to bookings so future service edits do not rewrite history.
ALTER TABLE "Booking"
  ADD COLUMN "serviceName" TEXT,
  ADD COLUMN "serviceDurationMinutes" INTEGER,
  ADD COLUMN "servicePriceCents" INTEGER,
  ADD COLUMN "serviceDepositType" "DepositType",
  ADD COLUMN "serviceDepositValue" INTEGER,
  ADD COLUMN "serviceBufferBeforeMinutes" INTEGER,
  ADD COLUMN "serviceBufferAfterMinutes" INTEGER;

UPDATE "Booking" b
SET
  "serviceName" = s."name",
  "serviceDurationMinutes" = s."durationMinutes",
  "servicePriceCents" = s."priceCents",
  "serviceDepositType" = s."depositType",
  "serviceDepositValue" = s."depositValue",
  "serviceBufferBeforeMinutes" = s."bufferBeforeMinutes",
  "serviceBufferAfterMinutes" = s."bufferAfterMinutes"
FROM "Service" s
WHERE b."serviceId" = s."id";

ALTER TABLE "Booking"
  ALTER COLUMN "serviceName" SET NOT NULL,
  ALTER COLUMN "serviceDurationMinutes" SET NOT NULL,
  ALTER COLUMN "servicePriceCents" SET NOT NULL,
  ALTER COLUMN "serviceDepositType" SET NOT NULL,
  ALTER COLUMN "serviceDepositValue" SET NOT NULL,
  ALTER COLUMN "serviceBufferBeforeMinutes" SET NOT NULL,
  ALTER COLUMN "serviceBufferAfterMinutes" SET NOT NULL;
