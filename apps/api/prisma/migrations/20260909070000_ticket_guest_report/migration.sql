-- AlterEnum
ALTER TYPE "TicketCategory" ADD VALUE 'ACCESS';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "ticketNo" TEXT,
ADD COLUMN "categoryCode" TEXT,
ADD COLUMN "requesterName" TEXT,
ADD COLUMN "requesterEmail" TEXT,
ADD COLUMN "departmentCode" TEXT,
ADD COLUMN "extension" TEXT;

-- Backfill existing rows (if any) before enforcing NOT NULL / UNIQUE
UPDATE "tickets"
SET
  "ticketNo" = '#IT-LEGACY-' || SUBSTRING("id" FROM 1 FOR 8),
  "categoryCode" = CASE "category"::text
    WHEN 'HARDWARE' THEN 'hardware'
    WHEN 'NETWORK' THEN 'network'
    WHEN 'SOFTWARE_BUG' THEN 'software'
    WHEN 'FEATURE_REQUEST' THEN 'feature_request'
    WHEN 'ACCESS' THEN 'access'
    ELSE 'other'
  END,
  "requesterName" = COALESCE("requesterName", 'Unknown'),
  "requesterEmail" = COALESCE("requesterEmail", 'unknown@localhost'),
  "departmentCode" = COALESCE("departmentCode", 'unknown'),
  "extension" = COALESCE("extension", '-')
WHERE "ticketNo" IS NULL;

ALTER TABLE "tickets" ALTER COLUMN "ticketNo" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "categoryCode" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "requesterName" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "requesterEmail" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "departmentCode" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "extension" SET NOT NULL;

CREATE UNIQUE INDEX "tickets_ticketNo_key" ON "tickets"("ticketNo");
CREATE INDEX "tickets_requesterEmail_idx" ON "tickets"("requesterEmail");
CREATE INDEX "tickets_createdAt_idx" ON "tickets"("createdAt");

-- Make requesterId optional for guest intake
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_requesterId_fkey";
ALTER TABLE "tickets" ALTER COLUMN "requesterId" DROP NOT NULL;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicPath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_attachments_ticketId_idx" ON "ticket_attachments"("ticketId");

ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
