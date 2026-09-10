-- Rename legacy IT_LEAD → SUPERVISOR when upgrading DBs that applied the old init enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'IT_LEAD'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'IT_LEAD' TO 'SUPERVISOR';
  END IF;
END $$;
