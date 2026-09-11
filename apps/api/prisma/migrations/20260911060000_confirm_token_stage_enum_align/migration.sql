-- Leftover user_confirm_tokens.stage may still use "UserConfirmTokenStage"
-- from reverted work, while Prisma now binds "ConfirmTokenStage".
DO $$ BEGIN
  CREATE TYPE "ConfirmTokenStage" AS ENUM ('AWAITING_USER_TEST', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "user_confirm_tokens"
  ALTER COLUMN "stage" TYPE "ConfirmTokenStage"
  USING ("stage"::text::"ConfirmTokenStage");

ALTER TABLE "user_confirm_tokens"
  ALTER COLUMN "stage" SET NOT NULL;

DO $$ BEGIN
  DROP TYPE "UserConfirmTokenStage";
EXCEPTION
  WHEN undefined_object THEN null;
  WHEN dependent_objects_still_exist THEN null;
END $$;
