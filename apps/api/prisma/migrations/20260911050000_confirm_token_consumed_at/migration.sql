-- Leftover user_confirm_tokens from reverted work may predate consumedAt/invalidatedAt.
-- CREATE TABLE IF NOT EXISTS in the previous migration would not add those columns.
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "consumedAt" TIMESTAMP(3);
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "invalidatedAt" TIMESTAMP(3);
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "stage" "ConfirmTokenStage";
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
ALTER TABLE "user_confirm_tokens" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
