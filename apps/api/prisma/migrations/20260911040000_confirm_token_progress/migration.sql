-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ConfirmTokenStage" AS ENUM ('AWAITING_USER_TEST', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "progress" INTEGER;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "reopenBrokenSuccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_confirm_tokens" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "stage" "ConfirmTokenStage" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_confirm_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_confirm_tokens_tokenHash_key" ON "user_confirm_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "user_confirm_tokens_ticketId_stage_idx" ON "user_confirm_tokens"("ticketId", "stage");
CREATE INDEX IF NOT EXISTS "user_confirm_tokens_expiresAt_idx" ON "user_confirm_tokens"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "user_confirm_tokens"
    ADD CONSTRAINT "user_confirm_tokens_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
