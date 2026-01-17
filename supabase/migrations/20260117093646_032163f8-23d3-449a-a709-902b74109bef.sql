-- Fix RLS for project_members: INSERT needs WITH CHECK (Postgres 14 compatible)
DO $$
BEGIN
  -- Drop overly broad policy missing WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='project_members'
      AND policyname='Workspace members can manage project members'
  ) THEN
    EXECUTE 'DROP POLICY "Workspace members can manage project members" ON public.project_members';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='project_members'
      AND policyname='Workspace members can insert project members'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Workspace members can insert project members"
      ON public.project_members
      FOR INSERT
      WITH CHECK (
        project_id IN (
          SELECT projects.id
          FROM public.projects
          WHERE is_workspace_member(projects.workspace_id, auth.uid())
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='project_members'
      AND policyname='Workspace members can update project members'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Workspace members can update project members"
      ON public.project_members
      FOR UPDATE
      USING (
        project_id IN (
          SELECT projects.id
          FROM public.projects
          WHERE is_workspace_member(projects.workspace_id, auth.uid())
        )
      )
      WITH CHECK (
        project_id IN (
          SELECT projects.id
          FROM public.projects
          WHERE is_workspace_member(projects.workspace_id, auth.uid())
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='project_members'
      AND policyname='Workspace members can delete project members'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Workspace members can delete project members"
      ON public.project_members
      FOR DELETE
      USING (
        project_id IN (
          SELECT projects.id
          FROM public.projects
          WHERE is_workspace_member(projects.workspace_id, auth.uid())
        )
      )
    $p$;
  END IF;
END $$;