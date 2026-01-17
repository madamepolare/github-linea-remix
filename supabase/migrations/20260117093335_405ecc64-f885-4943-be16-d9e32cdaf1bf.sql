-- Allow external project members without a workspace user
ALTER TABLE public.project_members
  ALTER COLUMN user_id DROP NOT NULL;

-- Ensure internal vs external rows are consistent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_members_internal_external_check'
  ) THEN
    ALTER TABLE public.project_members
      ADD CONSTRAINT project_members_internal_external_check
      CHECK (
        (
          is_external = true
          AND external_contact_id IS NOT NULL
          AND user_id IS NULL
        )
        OR
        (
          (is_external = false OR is_external IS NULL)
          AND user_id IS NOT NULL
          AND external_contact_id IS NULL
        )
      );
  END IF;
END $$;