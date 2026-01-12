DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'concours_restreint'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'concours_restreint';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'concours_ouvert'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'concours_ouvert';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'dialogue_competitif'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'dialogue_competitif';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'partenariat_innovation'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'partenariat_innovation';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'appel_offres_ouvert'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'appel_offres_ouvert';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'appel_offres_restreint'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'appel_offres_restreint';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'procedure_type' AND e.enumlabel = 'negociee'
  ) THEN
    ALTER TYPE public.procedure_type ADD VALUE 'negociee';
  END IF;
END $$;