-- Idempotent: leftover schema from a reverted live-board attempt may already exist.

ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'AWAITING_USER_TEST';

DO $$ BEGIN
  CREATE TYPE "AssigneeRole" AS ENUM ('LEAD', 'COLLABORATOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ticket_assignees" ADD COLUMN IF NOT EXISTS "role" "AssigneeRole" NOT NULL DEFAULT 'COLLABORATOR';

CREATE INDEX IF NOT EXISTS "ticket_assignees_ticketId_role_idx" ON "ticket_assignees"("ticketId", "role");
